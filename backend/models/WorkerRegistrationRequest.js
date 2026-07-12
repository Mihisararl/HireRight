import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const workerRegistrationRequestSchema = new mongoose.Schema(
  {
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

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
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
      min: 0
    },

    dailyRate: {
      type: Number,
      min: 0
    },

    rateType: {
      type: String,
      enum: ['hourly', 'daily'],
      default: 'hourly'
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

    agreedToBackgroundCheck: {
      type: Boolean,
      required: true,
      default: false
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },

    approvedAt: {
      type: Date
    },

    rejectedAt: {
      type: Date
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    reviewNotes: {
      type: String,
      trim: true
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// HASH PASSWORD BEFORE SAVE
workerRegistrationRequestSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("WorkerRegistrationRequest", workerRegistrationRequestSchema);
