import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const providerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    firstName: {
      type: String,
      required: true,
      trim: true
    },

    lastName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    district: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    postalCode: {
      type: String,
      trim: true
    },

    serviceCategory: {
      type: String,
      required: true,
      trim: true
    },

    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0
    },

    hourlyRate: {
      type: Number,
      required: true,
      min: 0
    },

    professionalBio: {
      type: String,
      trim: true
    },

    portfolioPhoto: {
      type: String
    },

    idDocument: {
      type: String,
      required: true
    },

    nicNumber: {
      type: String,
      trim: true,
      uppercase: true
    },

    bankName: {
      type: String,
      required: true,
      trim: true
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true
    },

    branch: {
      type: String,
      required: true,
      trim: true
    },

    accountHolderName: {
      type: String,
      required: true,
      trim: true
    },

    approvedAt: {
      type: Date,
      required: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    },

    // Daily availability (provider sets each day)
    availabilityDate: {
      type: String,
      trim: true
    },
    isAvailableToday: {
      type: Boolean,
      default: true
    },

    location: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Provider", providerSchema);
