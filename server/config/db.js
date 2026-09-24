const mongoose = require('mongoose');
const seedDatabase = require('./seed');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agritrade';
        const conn = await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
        
        // Seed database if empty so MongoDB Compass has collections and data ready immediately
        await seedDatabase();
    } catch (error) {
        console.warn(`⚠️ MongoDB Connection Error: ${error.message}`);
        console.warn(`ℹ️ AgriTrade AI Backend running in resilient mode (Database offline or starting).`);
    }
};

module.exports = connectDB;