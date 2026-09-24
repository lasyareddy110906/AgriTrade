const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const connectDB = require('./config/db');
const { initRealtimeSync } = require('./config/realtimeSync');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
        credentials: true
    }
});

// Middlewares
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cors({ origin: '*', credentials: true }));

// Attach Socket.io instance to every HTTP request
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Connect Database & Initialize Real-Time Sync Engine
connectDB();
initRealtimeSync(io);

// Register All Backend Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/lots', require('./routes/lotRoutes'));
app.use('/api/inspections', require('./routes/inspectionRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/shipments', require('./routes/shipmentRoutes'));
app.use('/api/trace', require('./routes/traceabilityRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

app.get('/', (req, res) => {
    res.json({
        service: 'AgriTrade AI Enterprise Backend Service',
        status: 'RUNNING',
        port: process.env.PORT || 5000,
        realtimeSync: 'ACTIVE',
        mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agritrade',
        endpoints: [
            '/api/auth', '/api/lots', '/api/inspections', 
            '/api/orders', '/api/shipments', '/api/trace', 
            '/api/ai', '/api/analytics'
        ]
    });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('Unhandled Backend Exception:', err.stack);
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal Server Error',
        path: req.path
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 AgriTrade AI Backend with Real-Time Database Sync running on port ${PORT}`);
    console.log(`🍃 Connected to MongoDB Compass target: ${process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agritrade'}`);
});