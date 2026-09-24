const mongoose = require('mongoose');

const ShipmentSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    logisticsCoordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vehicleNumber: { type: String, required: true },
    driverName: { type: String, required: true },
    sourceLocation: { type: String, required: true },
    destinationLocation: { type: String, required: true },
    shipmentStatus: { 
        type: String, 
        enum: ['Planned', 'Dispatched', 'In Transit', 'Delivered', 'Cancelled'], 
        default: 'Dispatched',
        index: true
    },
    estimatedDeliveryDate: { type: Date, required: true },
    telemetry: {
        temperatureC: { type: Number, default: 22.5 },
        humidityPercent: { type: Number, default: 58.0 },
        gpsCoordinates: { type: String, default: '17.3850 N, 78.4867 E' }
    }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', ShipmentSchema);