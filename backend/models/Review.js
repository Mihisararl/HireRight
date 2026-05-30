import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider', required: true },
		providerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
		serviceRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
		rating: { type: Number, min: 1, max: 5, required: true },
		comment: { type: String, trim: true }
	},
	{ timestamps: true }
);

reviewSchema.index({ userId: 1, serviceRequestId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);
