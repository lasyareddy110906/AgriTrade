const express = require('express');
const router = express.Router();
const Shipment = require('../models/ShipmentModel');
const Order = require('../models/OrderModel');
const Lot = require('../models/LotModel');
const { broadcastChange } = require('../config/realtimeSync');

// Dispatch a shipment for an order (Logistics Coordinator)
router.post('/create', async (req, res) => {
    try {
        const { orderId, logisticsCoordinatorId, coordinatorName, vehicleNumber, driverName, sourceLocation, destinationLocation, estimatedDeliveryDate } = req.body;

        if (!orderId || !vehicleNumber || !driverName) {
            return res.status(400).json({ error: 'Order ID, Vehicle Number, and Driver Name are required.' });
        }

        const order = await Order.findById(orderId).populate('lotId');
        if (!order) return res.status(404).json({ error: 'Purchase Order not found.' });

        const newShipment = new Shipment({
            orderId,
            logisticsCoordinatorId: logisticsCoordinatorId || order.buyerId,
            vehicleNumber,
            driverName,
            sourceLocation: sourceLocation || 'Central Collection Hub',
            destinationLocation: destinationLocation || 'Buyer Warehouse',
            shipmentStatus: 'Dispatched',
            estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : new Date(Date.now() + 5 * 86400000),
            telemetry: {
                temperatureC: 21.4,
                humidityPercent: 55.0,
                gpsCoordinates: '17.3850° N, 78.4867° E'
            }
        });

        const savedShipment = await newShipment.save();

        // Update Order Status
        order.orderStatus = 'Dispatched';
        await order.save();

        // State machine transition on Lot: ALLOCATED -> DISPATCHED
        const lot = await Lot.findById(order.lotId._id || order.lotId);
        if (lot) {
            lot.status = 'DISPATCHED';
            lot.history.push({
                stage: 'DISPATCHED',
                timestamp: new Date(),
                actorName: coordinatorName || 'Logistics Coordinator',
                actorRole: 'Logistics Coordinator',
                notes: `Shipment dispatched via vehicle ${vehicleNumber} (Driver: ${driverName}). Destination: ${destinationLocation}`
            });
            await lot.save();
        }

        // Broadcast real-time change to all connected clients
        broadcastChange('shipments', 'INSERT', savedShipment);
        broadcastChange('orders', 'UPDATE', order);
        if (lot) broadcastChange('lots', 'UPDATE', lot);

        res.status(201).json({ 
            message: 'Shipment dispatched successfully! Real-time transit telemetry initialized.', 
            shipment: savedShipment 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update shipment transit status (In Transit -> Delivered)
router.patch('/:id/status', async (req, res) => {
    try {
        const { shipmentStatus, coordinatorName } = req.body;

        const shipment = await Shipment.findById(req.params.id).populate('orderId');
        if (!shipment) return res.status(404).json({ error: 'Shipment record not found.' });

        shipment.shipmentStatus = shipmentStatus;
        await shipment.save();

        // If delivered, release escrow payment and finalize lot & order lifecycle
        if (shipmentStatus === 'Delivered') {
            const order = await Order.findById(shipment.orderId._id || shipment.orderId);
            if (order) {
                order.orderStatus = 'Delivered';
                order.paymentStatus = 'Paid'; // Release escrow funds to Farmer
                await order.save();

                const lot = await Lot.findById(order.lotId);
                if (lot) {
                    lot.status = 'DELIVERED';
                    lot.history.push({
                        stage: 'DELIVERED',
                        timestamp: new Date(),
                        actorName: coordinatorName || 'Logistics Coordinator',
                        actorRole: 'Logistics Coordinator',
                        notes: `Shipment delivered to buyer. Escrow payment of ₹${order.totalAmount} released.`
                    });
                    await lot.save();
                }
            }
        }

        // Broadcast real-time update
        broadcastChange('shipments', 'UPDATE', shipment);

        res.json({ 
            message: `Shipment status updated to '${shipmentStatus}' successfully.`, 
            shipment 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all active & completed shipments
router.get('/', async (req, res) => {
    try {
        const shipments = await Shipment.find()
            .populate({ path: 'orderId', populate: { path: 'lotId' } })
            .populate('logisticsCoordinatorId', 'name email region')
            .sort({ createdAt: -1 });
        res.json(shipments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;