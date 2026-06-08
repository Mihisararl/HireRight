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
    // Booking type: 'direct' (from Services page) or 'post' (customer created post)
    bookingType: {
      type: String,
      enum: ['direct', 'post'],
      default: 'post'
    },
    status: {
      type: String,
      default: "Pending", // Pending / OfferSent / Accepted / Completed / Rejected / ProviderRejected
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For 'post' type bookings - provider sends offer to customer
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
    // For 'direct' type bookings - customer books provider, provider accepts/rejects
    providerResponse: {
      respondedAt: { type: Date },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
      },
      responseMessage: { type: String }
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
  // Legacy MongoDB documents may still have `budget` instead of `dailyBudget`
  if ((this.dailyBudget == null || this.dailyBudget === undefined) && this.get('budget') != null) {
    this.dailyBudget = Number(this.get('budget'));
  }
  next();
});

export default mongoose.model("ServiceRequest", serviceRequestSchema);
