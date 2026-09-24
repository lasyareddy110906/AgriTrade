const express = require('express');
const router = express.Router();
const Lot = require('../models/LotModel');
const Inspection = require('../models/InspectionModel');
const Order = require('../models/OrderModel');
const Shipment = require('../models/ShipmentModel');

// Public QR Code & Provenance Traceability Endpoint
router.get('/:id', async (req, res) => {
    try {
        const idOrQr = req.params.id;

        // Query by _id if valid ObjectId, else query by qrCodeString
        let lot = null;
        if (idOrQr.match(/^[0-9a-fA-F]{24}$/)) {
            lot = await Lot.findById(idOrQr).populate('farmerId', 'name email region');
        }
        
        if (!lot) {
            lot = await Lot.findOne({ qrCodeString: idOrQr }).populate('farmerId', 'name email region');
        }

        if (!lot) {
            return res.status(404).json({ error: 'Invalid or expired traceability QR code / Lot ID.' });
        }

        // Fetch associated quality inspection
        const inspection = await Inspection.findOne({ lotId: lot._id }).populate('inspectorId', 'name region');

        // Fetch associated order & shipment
        const order = await Order.findOne({ lotId: lot._id }).populate('buyerId', 'name region');
        const shipment = order ? await Shipment.findOne({ orderId: order._id }).populate('logisticsCoordinatorId', 'name') : null;

        // Build public provenance record
        res.json({
            lotId: lot._id,
            qrCodeString: lot.qrCodeString,
            cropName: lot.cropName,
            category: lot.category,
            quantityKg: lot.quantityKg,
            harvestDate: lot.harvestDate,
            region: lot.region,
            farmerName: lot.farmerId ? lot.farmerId.name : 'Registered Partner Farmer',
            currentStatus: lot.status,
            qualityGrade: lot.qualityGrade || 'Pending Inspection',
            qualityScore: lot.qualityScore || null,
            moistureContentPercent: lot.moistureContentPercent || (inspection ? inspection.moistureContentPercent : null),
            defectsFound: lot.defectsFound || (inspection ? inspection.defectsFound : 'None'),
            aiEstimatedPricePerKg: lot.aiEstimatedPricePerKg,
            inspectionDetails: inspection ? {
                inspectorName: inspection.inspectorId ? inspection.inspectorId.name : 'Certified Inspector',
                grade: inspection.grade,
                moisture: inspection.moistureContentPercent,
                defects: inspection.defectsFound,
                remarks: inspection.remarks,
                inspectionDate: inspection.createdAt
            } : null,
            orderSummary: order ? {
                orderId: order._id,
                totalAmount: order.totalAmount,
                paymentStatus: order.paymentStatus,
                buyerName: order.buyerId ? order.buyerId.name : 'Verified Commercial Buyer'
            } : null,
            logisticsSummary: shipment ? {
                shipmentId: shipment._id,
                vehicleNumber: shipment.vehicleNumber,
                driverName: shipment.driverName,
                status: shipment.shipmentStatus,
                estimatedDeliveryDate: shipment.estimatedDeliveryDate
            } : null,
            history: lot.history && lot.history.length > 0 ? lot.history : [
                { stage: 'CREATED', timestamp: lot.createdAt, actorName: 'Farmer', actorRole: 'Farmer', notes: 'Harvest batch recorded on ledger.' },
                ...(inspection ? [{ stage: 'INSPECTED', timestamp: inspection.createdAt, actorName: 'Inspector', actorRole: 'Inspector', notes: `Grade assigned: ${inspection.grade}` }] : []),
                ...(shipment ? [{ stage: 'DISPATCHED', timestamp: shipment.createdAt, actorName: 'Logistics', actorRole: 'Logistics Coordinator', notes: `In transit via ${shipment.vehicleNumber}` }] : [])
            ]
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;