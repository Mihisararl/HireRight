import mongoose from 'mongoose';
import { PLATFORM_COMMISSION_PERCENT } from '../constants/commission.js';
import { SETTLEMENT_TYPE_VALUES } from '../constants/settlement.js';

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    /** Full amount paid by the customer through the gateway */
    amount: { type: Number, required: true },
    serviceAmount: { type: Number },
    settlementType: {
        type: String,
        enum: SETTLEMENT_TYPE_VALUES,
    },
    settlementAmount: { type: Number },
    commissionRate: { type: Number, default: PLATFORM_COMMISSION_PERCENT },
    commissionAmount: { type: Number },
    providerAmount: { type: Number },
    refundAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'LKR' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    payoutStatus: { type: String, enum: ['pending', 'hold', 'paid', 'refunded'], default: 'pending' },
    holdUntil: { type: Date },
    approvedAt: { type: Date },
    releasedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);
