import mongoose from 'mongoose';
import { SETTLEMENT_TYPE_VALUES } from '../constants/settlement.js';

const complaintSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    providerName: { type: String, required: true, trim: true },
    providerPhone: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    settlementType: {
        type: String,
        enum: SETTLEMENT_TYPE_VALUES,
    },
    settlementAmount: { type: Number },
    resolvedAt: { type: Date },
    reopenUntil: { type: Date },
    reopenedAt: { type: Date },
    reopenCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Complaint', complaintSchema);
