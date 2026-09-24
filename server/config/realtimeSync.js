const mongoose = require('mongoose');

let ioInstance = null;
let lastState = {};

/**
 * Initialize Real-Time Sync Engine for MongoDB & MongoDB Compass
 * @param {object} io - Socket.io Server Instance
 */
const initRealtimeSync = (io) => {
    ioInstance = io;

    io.on('connection', (socket) => {
        console.log(`🔌 Client connected to Real-Time DB Stream [ID: ${socket.id}]`);

        // Send connection acknowledgment with server timestamp
        socket.emit('socket_connected', {
            status: 'CONNECTED',
            timestamp: new Date().toISOString(),
            message: 'Real-time database connection established with MongoDB Compass sync.'
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Client disconnected [ID: ${socket.id}]`);
        });
    });

    // 1. Setup MongoDB Change Stream (captures direct MongoDB Compass edits)
    setupChangeStream(io);

    // 2. Setup DB Polling Fallback (ensures standalone MongoDB Compass edits sync instantly)
    setupDbPollingFallback(io);
};

/**
 * MongoDB Change Stream Watcher for Replica Set / Atlas / Compass direct edits
 */
const setupChangeStream = (io) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            mongoose.connection.once('open', () => setupChangeStream(io));
            return;
        }

        const changeStream = mongoose.connection.watch([], { fullDocument: 'updateLookup' });

        changeStream.on('change', (change) => {
            console.log(`⚡ [MongoDB Compass / DB ChangeStream] Event detected: ${change.operationType} on collection ${change.ns?.coll}`);

            const payload = {
                collection: change.ns?.coll,
                operationType: change.operationType,
                documentId: change.documentKey?._id,
                fullDocument: change.fullDocument || null,
                timestamp: new Date().toISOString(),
                source: 'MONGODB_CHANGE_STREAM'
            };

            io.emit('db_realtime_change', payload);

            // Broadcast specific model updates
            const coll = change.ns?.coll;
            if (coll === 'lots') io.emit('lot_updated', payload);
            if (coll === 'orders') io.emit('order_updated', payload);
            if (coll === 'shipments') io.emit('shipment_updated', payload);
            if (coll === 'inspections') io.emit('inspection_updated', payload);
            if (coll === 'users') io.emit('user_updated', payload);
        });

        changeStream.on('error', (err) => {
            console.warn(`ℹ️ MongoDB ChangeStream info: ${err.message} (Falling back to DB polling watcher for MongoDB Compass updates)`);
        });

        console.log('📡 MongoDB ChangeStream Watcher active for MongoDB Compass real-time synchronization.');
    } catch (err) {
        console.warn(`ℹ️ ChangeStream notice: ${err.message}. DB polling fallback active.`);
    }
};

/**
 * DB Polling Fallback to detect direct updates from MongoDB Compass on standalone instances
 */
const setupDbPollingFallback = (io) => {
    setInterval(async () => {
        try {
            if (mongoose.connection.readyState !== 1) return;

            const Lot = mongoose.models.Lot;
            const Order = mongoose.models.Order;
            const Inspection = mongoose.models.Inspection;
            const Shipment = mongoose.models.Shipment;

            if (!Lot || !Order || !Inspection || !Shipment) return;

            const [lotCount, orderCount, inspectionCount, shipmentCount, latestLot, latestOrder, latestShipment] = await Promise.all([
                Lot.countDocuments(),
                Order.countDocuments(),
                Inspection.countDocuments(),
                Shipment.countDocuments(),
                Lot.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
                Order.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean(),
                Shipment.findOne().sort({ updatedAt: -1 }).select('updatedAt').lean()
            ]);

            const currentState = {
                lotCount,
                orderCount,
                inspectionCount,
                shipmentCount,
                lotMaxUpdate: latestLot?.updatedAt?.getTime() || 0,
                orderMaxUpdate: latestOrder?.updatedAt?.getTime() || 0,
                shipmentMaxUpdate: latestShipment?.updatedAt?.getTime() || 0
            };

            if (Object.keys(lastState).length > 0) {
                const isChanged = 
                    currentState.lotCount !== lastState.lotCount ||
                    currentState.orderCount !== lastState.orderCount ||
                    currentState.inspectionCount !== lastState.inspectionCount ||
                    currentState.shipmentCount !== lastState.shipmentCount ||
                    currentState.lotMaxUpdate !== lastState.lotMaxUpdate ||
                    currentState.orderMaxUpdate !== lastState.orderMaxUpdate ||
                    currentState.shipmentMaxUpdate !== lastState.shipmentMaxUpdate;

                if (isChanged) {
                    console.log('⚡ [Realtime Sync] Database change detected via MongoDB Compass polling watcher. Broadcasting live update...');
                    const payload = {
                        timestamp: new Date().toISOString(),
                        source: 'REALTIME_POLLING_WATCHER',
                        message: 'Database state updated from MongoDB Compass / Server'
                    };
                    io.emit('db_realtime_change', payload);
                }
            }

            lastState = currentState;
        } catch (err) {
            // silent catch during connection transitions
        }
    }, 2500);
};

/**
 * Explicit helper to broadcast real-time change events from Express route handlers
 */
const broadcastChange = (collection, operationType, data = {}) => {
    if (ioInstance) {
        const payload = {
            collection,
            operationType,
            data,
            timestamp: new Date().toISOString(),
            source: 'API_MUTATION'
        };
        ioInstance.emit('db_realtime_change', payload);
        if (collection === 'lots') ioInstance.emit('lot_updated', payload);
        if (collection === 'orders') ioInstance.emit('order_updated', payload);
        if (collection === 'shipments') ioInstance.emit('shipment_updated', payload);
        if (collection === 'inspections') ioInstance.emit('inspection_updated', payload);
    }
};

module.exports = {
    initRealtimeSync,
    broadcastChange
};
