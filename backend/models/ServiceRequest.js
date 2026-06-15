import mongoose from "mongoose";
import { AGREEMENT_STATUSES } from "../utils/serviceAgreement.js";

const agreementStatusValues = Object.values(AGREEMENT_STATUSES);

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
    /** Customer budget in LKR per day */
    dailyBudget: {
      type: Number,
      required: true,
      min: 1,
    },
    /** Legacy field kept for old records — do not use for new requests */
    budget: {
      type: Number,
    },
    location: {
      lat: { type: Number },
      lng: { type: Number },
      address: { type: String, required: true },
    },
    journeyActive: {
      type: Boolean,
      default: false,
    },
    journeyStartedAt: {
      type: Date,
    },
    specificRequirements: {
      type: String,
    },
    bookingType: {
      type: String,
      enum: ['direct', 'post'],
      default: 'post'
    },
    agreementStatus: {
      type: String,
      enum: agreementStatusValues,
      default: AGREEMENT_STATUSES.PENDING_PROVIDER_ESTIMATE,
    },
    dailyRate: { type: Number },
    estimatedDurationDays: { type: Number },
    agreedTotalAmount: { type: Number },
    status: {
      type: String,
      default: "Pending",
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    /** Post requests — provider offer to customer */
    providerOffer: {
      sendAt: { type: Date },
      message: { type: String },
      providerMessage: { type: String },
      dailyRate: { type: Number },
      estimatedDurationDays: { type: Number },
      totalEstimatedCost: { type: Number },
      proposedPrice: { type: Number },
      proposedDate: { type: String },
      customerResponse: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      },
      customerResponseAt: { type: Date }
    },
    /** Direct bookings — provider estimate and customer confirmation */
    providerResponse: {
      respondedAt: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'estimated', 'accepted', 'rejected'],
        default: 'pending'
      },
      responseMessage: { type: String },
      providerMessage: { type: String },
      dailyRate: { type: Number },
      estimatedDurationDays: { type: Number },
      totalEstimatedCost: { type: Number },
      customerConfirmation: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending',
      },
      customerConfirmedAt: { type: Date },
    },
    acceptedAt: {
      type: Date,
    },
    customerCompleted: {
      type: Boolean,
      default: false
    },
    providerCompleted: {
      type: Boolean,
      default: false
    },
    customerCompletedAt: {
      type: Date
    },
    providerCompletedAt: {
      type: Date
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

serviceRequestSchema.pre('validate', function preValidateDailyBudget(next) {
  if ((this.dailyBudget == null || this.dailyBudget === undefined) && this.get('budget') != null) {
    this.dailyBudget = Number(this.get('budget'));
  }
  next();
});

export default mongoose.model("ServiceRequest", serviceRequestSchema);
