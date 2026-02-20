import mongoose from "mongoose";

const serviceRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceCategory: {
      type: String,
      required: true,
    },
    serviceTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    preferredDate: {
      type: String,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
    },
    estimatedDuration: {
      type: String,
    },
    budget: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    specificRequirements: {
      type: String,
    },
    status: {
      type: String,
      default: "Pending", // Pending / OfferSent / Accepted / Completed / Rejected
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    providerOffer: {
      sendAt: { type: Date },
      message: { type: String },
      proposedPrice: { type: Number },
      proposedDate: { type: String },
      customerResponse: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      },
      customerResponseAt: { type: Date }
    },
    acceptedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ServiceRequest", serviceRequestSchema);
