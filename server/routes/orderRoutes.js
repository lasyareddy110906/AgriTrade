const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/OrderModel');
const Lot = require('../models/LotModel');
const { broadcastChange } = require('../config/realtimeSync');

// Buyer creates a purchase order for an inspected lot
router.post('/create', async (req, res) => {
    try {
        const { buyerId, buyerName, lotId, agreedPrice } = req.body;

        if (!buyerId || !lotId || !agreedPrice) {
            return res.status(400).json({ error: 'Buyer ID, Lot ID, and Agreed Price per Kg are required.' });
        }

        const lot = await Lot.findById(lotId);
        if (!lot) return res.status(404).json({ error: 'Target produce lot not found.' });

        const agreedPriceNum = Number(agreedPrice);
        const totalAmount = Math.round(lot.quantityKg * agreedPriceNum * 100) / 100;

        const newOrder = new Order({
            buyerId,
            lotId,
            agreedPrice: agreedPriceNum,
            totalAmount,
            orderStatus: 'Allocated',
            paymentStatus: 'Escrow Held'
        });

        const savedOrder = await newOrder.save();
        
        // Transition lot state machine: ACCEPTED / STORED -> ALLOCATED
        lot.status = 'ALLOCATED';
        lot.history.push({
            stage: 'ALLOCATED',
            timestamp: new Date(),
            actorName: buyerName || 'Enterprise Buyer',
            actorRole: 'Buyer',
            notes: `Purchase Order ${savedOrder._id.toString().slice(-6)} created. Escrow payment of ₹${totalAmount} locked.`
        });
        const updatedLot = await lot.save();

        // Broadcast real-time change to all connected clients
        broadcastChange('orders', 'INSERT', savedOrder);
        broadcastChange('lots', 'UPDATE', updatedLot);

        res.status(201).json({ 
            message: 'Purchase order created successfully! Escrow funds locked in smart contract.', 
            order: savedOrder 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get orders by buyer, farmer, or platform
router.get('/', async (req, res) => {
    try {
        const { buyerId, farmerId } = req.query;
        let query = {};

        if (buyerId && mongoose.Types.ObjectId.isValid(buyerId)) {
            query.buyerId = buyerId;
        }

        let orders = await Order.find(query)
            .populate('buyerId', 'name email region')
            .populate({ path: 'lotId', populate: { path: 'farmerId', select: 'name email region' } })
            .sort({ createdAt: -1 });

        if (farmerId) {
            orders = orders.filter(o => {
                const fId = o.lotId?.farmerId?._id?.toString() || o.lotId?.farmerId?.toString() || o.lotId?.farmerId;
                return fId === farmerId || String(fId) === String(farmerId);
            });
        }

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;