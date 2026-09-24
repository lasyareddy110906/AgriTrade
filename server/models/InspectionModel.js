const mongoose = require('mongoose');

const InspectionSchema = new mongoose.Schema({
    lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lot', required: true, index: true },
    inspectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    grade: { type: String, enum: ['Grade A', 'Grade B', 'Grade C', 'Rejected'], required: true },
    moistureContentPercent: { type: Number, required: true },
    defectsFound: { type: String },
    remarks: { type: String },
    aiDiagnostic: {
        disease: { type: String },
        confidence: { type: Number },
        recommendation: { type: String }
    },
    inspectionDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Inspection', InspectionSchema);