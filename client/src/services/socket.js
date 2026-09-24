import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;
let listeners = new Set();
let statusListeners = new Set();

export const initSocket = () => {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('⚡ Connected to AgriTrade AI Real-Time Database Stream [Socket ID:', socket.id, ']');
        notifyStatus(true);
    });

    socket.on('disconnect', (reason) => {
        console.warn('⚠️ Disconnected from Real-Time Database Stream:', reason);
        notifyStatus(false);
    });

    socket.on('connect_error', (err) => {
        console.warn('ℹ️ Real-Time Socket connecting / server starting:', err.message);
        notifyStatus(false);
    });

    socket.on('socket_connected', (data) => {
        console.log('🟢 Real-Time Database connection acknowledged:', data.message);
        notifyStatus(true);
    });

    socket.on('db_realtime_change', (changeData) => {
        console.log('⚡ [Real-Time DB Event]:', changeData);
        listeners.forEach(cb => {
            try { cb(changeData); } catch (e) { console.error('Error in listener:', e); }
        });
    });

    socket.on('lot_updated', (data) => notifyListeners({ ...data, type: 'LOT' }));
    socket.on('order_updated', (data) => notifyListeners({ ...data, type: 'ORDER' }));
    socket.on('inspection_updated', (data) => notifyListeners({ ...data, type: 'INSPECTION' }));
    socket.on('shipment_updated', (data) => notifyListeners({ ...data, type: 'SHIPMENT' }));

    return socket;
};

const notifyStatus = (status) => {
    statusListeners.forEach(cb => {
        try { cb(status); } catch (e) {}
    });
};

const notifyListeners = (data) => {
    listeners.forEach(cb => {
        try { cb(data); } catch (e) {}
    });
};

export const subscribeToDbChanges = (callback) => {
    initSocket();
    listeners.add(callback);
    return () => {
        listeners.delete(callback);
    };
};

export const subscribeToSocketStatus = (callback) => {
    initSocket();
    statusListeners.add(callback);
    // Send current status immediately
    callback(socket?.connected || false);
    return () => {
        statusListeners.delete(callback);
    };
};

export const getSocket = () => {
    return initSocket();
};

export default {
    initSocket,
    subscribeToDbChanges,
    subscribeToSocketStatus,
    getSocket
};
