const express = require('express');
const router = express.Router();
const Lot = require('../models/LotModel');
const { broadcastChange } = require('../config/realtimeSync');

// Create new produce lot (Farmer / Collection Center)
router.post('/create', async (req, res) => {
    try {
        const { farmerId, cropName, category, quantityKg, harvestDate, region, actorName } = req.body;
        
        if (!farmerId || !cropName || !category || !quantityKg) {
            return res.status(400).json({ error: 'Farmer ID, crop name, category, and quantity are required.' });
        }

        const qrCodeString = `LOT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const initialHistory = [{
            stage: 'CREATED',
            timestamp: new Date(),
            actorName: actorName || 'Farmer Producer',
            actorRole: 'Farmer',
            notes: `Harvest lot initialized with ${quantityKg} Kg of ${cropName}.`
        }];

        const newLot = new Lot({
            farmerId,
            cropName,
            category,
            quantityKg: Number(quantityKg),
            harvestDate: harvestDate ? new Date(harvestDate) : new Date(),
            region: region || 'North Region',
            status: 'CREATED',
            qrCodeString,
            history: initialHistory
        });

        const savedLot = await newLot.save();
        
        // Broadcast real-time change to all connected dashboards
        broadcastChange('lots', 'INSERT', savedLot);

        res.status(201).json({ message: 'Produce lot created successfully!', lot: savedLot });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all lots (with region, status, farmerId, category query filters)
router.get('/', async (req, res) => {
    try {
        const { region, status, farmerId, category } = req.query;
        let query = {};
        
        if (region && region !== 'All') query.region = region;
        if (farmerId) query.farmerId = farmerId;
        if (category && category !== 'All') query.category = category;

        if (status) {
            query.$or = [
                { status: status },
                { status: status.toUpperCase() },
                { status: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() }
            ];
        }

        const lots = await Lot.find(query)
            .populate('farmerId', 'name email region')
            .sort({ createdAt: -1 });

        res.json(lots);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single lot details by ID
router.get('/:id', async (req, res) => {
    try {
        const lot = await Lot.findById(req.params.id).populate('farmerId', 'name email region');
        if (!lot) return res.status(404).json({ error: 'Produce lot not found' });
        res.json(lot);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// State Machine Update: Transition lot status & append history
router.patch('/:id/status', async (req, res) => {
    try {
        const { status, qualityGrade, qualityScore, actorName, actorRole, notes } = req.body;
        
        const lot = await Lot.findById(req.params.id);
        if (!lot) return res.status(404).json({ error: 'Lot not found' });

        if (status) lot.status = status;
        if (qualityGrade) lot.qualityGrade = qualityGrade;
        if (qualityScore !== undefined) lot.qualityScore = qualityScore;

        // Append to audit history
        lot.history.push({
            stage: status || lot.status,
            timestamp: new Date(),
            actorName: actorName || 'System',
            actorRole: actorRole || 'Automated',
            notes: notes || `Lot status updated to ${status || lot.status}`
        });

        const updatedLot = await lot.save();
        
        // Broadcast real-time change
        broadcastChange('lots', 'UPDATE', updatedLot);

        res.json({ message: 'Lot status updated successfully', lot: updatedLot });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;