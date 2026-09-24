const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['Platform Admin', 'Farmer', 'Collection Center Manager', 'Quality Inspector', 'Buyer', 'Logistics Coordinator'], 
        required: true,
        index: true
    },
    region: { type: String, required: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);