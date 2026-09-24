const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    stage: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    actorName: { type: String, default: 'System' },
    actorRole: { type: String, default: 'Automated' },
    notes: { type: String }
}, { _id: false });

const LotSchema = new mongoose.Schema({
    farmerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cropName: { type: String, required: true },
    category: { type: String, required: true },
    quantityKg: { type: Number, required: true },
    harvestDate: { type: Date, required: true },
    region: { type: String, required: true, index: true },
    
    // State machine lifecycle: CREATED -> RECEIVED -> INSPECTED -> ACCEPTED/REJECTED -> STORED -> ALLOCATED -> DISPATCHED -> DELIVERED
    status: { 
        type: String, 
        enum: [
            'CREATED', 'RECEIVED', 'INSPECTED', 'ACCEPTED', 'REJECTED', 'STORED', 'ALLOCATED', 'DISPATCHED', 'DELIVERED',
            'Created', 'Received', 'Inspected', 'Stored', 'Dispatched', 'Delivered' // Support legacy titlecase strings
        ], 
        default: 'CREATED',
        index: true 
    },

    qualityGrade: { type: String, enum: ['Grade A', 'Grade B', 'Grade C', 'Rejected', null], default: null },
    qualityScore: { type: Number, default: null },
    moistureContentPercent: { type: Number, default: null },
    defectsFound: { type: String, default: null },

    aiEstimatedPricePerKg: { type: Number, default: null },
    aiValuation: { type: Number, default: null },
    aiCropHealth: {
        status: { type: String },
        healthScore: { type: Number },
        disease: { type: String },
        confidence: { type: Number },
        recommendation: { type: String }
    },

    qrCodeString: { type: String, unique: true, index: true },
    
    // Embedded immutable audit timeline history
    history: [HistorySchema]
}, { timestamps: true });

// Compound indexes for fast querying & executive reporting
LotSchema.index({ region: 1, status: 1 });
LotSchema.index({ farmerId: 1, createdAt: -1 });

module.exports = mongoose.model('Lot', LotSchema);