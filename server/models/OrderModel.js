const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true, index: true },
    agreedPrice: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    orderStatus: { 
        type: String, 
        enum: ['Pending', 'Confirmed', 'Allocated', 'Dispatched', 'Delivered', 'Cancelled'], 
        default: 'Pending',
        index: true
    },
    paymentStatus: { 
        type: String, 
        enum: ['Unpaid', 'Escrow Held', 'Paid', 'Refunded'], 
        default: 'Escrow Held' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);