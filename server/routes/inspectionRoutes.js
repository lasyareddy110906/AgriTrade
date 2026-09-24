const express = require('express');
const router = express.Router();
const Inspection = require('../models/InspectionModel');
const Lot = require('../models/LotModel');
const { broadcastChange } = require('../config/realtimeSync');

// Record an inspection and advance state machine (INSPECTED -> ACCEPTED / REJECTED)
router.post('/record', async (req, res) => {
    try {
        const { lotId, inspectorId, inspectorName, grade, moistureContentPercent, defectsFound, remarks, aiDiagnostic } = req.body;

        if (!lotId || !grade) {
            return res.status(400).json({ error: 'Lot ID and Quality Grade are required.' });
        }

        const lot = await Lot.findById(lotId);
        if (!lot) return res.status(404).json({ error: 'Target produce lot not found.' });

        const inspection = new Inspection({
            lotId,
            inspectorId: inspectorId || lot.farmerId,
            grade,
            moistureContentPercent: Number(moistureContentPercent) || 12.0,
            defectsFound: defectsFound || 'None detected',
            remarks: remarks || 'Quality inspection completed.',
            aiDiagnostic: aiDiagnostic || null
        });

        await inspection.save();

        // State Machine transition based on inspection outcome
        const nextStatus = grade === 'Rejected' ? 'REJECTED' : 'ACCEPTED';

        lot.qualityGrade = grade;
        lot.qualityScore = grade === 'Grade A' ? 95 : grade === 'Grade B' ? 82 : grade === 'Grade C' ? 68 : 35;
        lot.moistureContentPercent = Number(moistureContentPercent) || 12.0;
        lot.defectsFound = defectsFound || 'None';
        lot.status = nextStatus;

        // Append to audit history
        lot.history.push({
            stage: nextStatus,
            timestamp: new Date(),
            actorName: inspectorName || 'Quality Inspector',
            actorRole: 'Quality Inspector',
            notes: `Inspection completed. Assigned ${grade}. Moisture: ${moistureContentPercent}%. Remarks: ${remarks || 'None'}`
        });

        const updatedLot = await lot.save();

        // Broadcast real-time change to all connected clients
        broadcastChange('inspections', 'INSERT', inspection);
        broadcastChange('lots', 'UPDATE', updatedLot);

        res.status(201).json({ 
            message: `Quality inspection recorded successfully! Lot status advanced to ${nextStatus}.`, 
            inspection, 
            updatedLot 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get inspection history for a specific lot
router.get('/lot/:lotId', async (req, res) => {
    try {
        const inspections = await Inspection.find({ lotId: req.params.lotId })
            .populate('inspectorId', 'name email region')
            .sort({ createdAt: -1 });
        res.json(inspections);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;