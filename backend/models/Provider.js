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
      default: 4.8,
      min: 0,
      max: 5
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("Provider", providerSchema);
