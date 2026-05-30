import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
    serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'LKR' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    payoutStatus: { type: String, enum: ['pending', 'hold', 'paid'], default: 'pending' },
    holdUntil: { type: Date },
    approvedAt: { type: Date },
    releasedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Payment', paymentSchema);
