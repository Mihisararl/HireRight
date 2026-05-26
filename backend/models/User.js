import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  district: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },

  // Provider-specific fields
  serviceCategory: { type: String },
  yearsOfExperience: { type: Number },
  hourlyRate: { type: Number },
  professionalBio: { type: String },
  portfolioPhoto: { type: String }, // URL or path
  idDocument: { type: String }, // URL or path to ID document
  city: { type: String },
  verificationToken: String,
  verificationExpires: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },


  // Provider approval status
  providerStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: function () {
      return this.role === 'provider';
    }
  },

  approvedAt: { type: Date },
  rejectedAt: { type: Date }
}, { timestamps: true });


// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();

});

export default mongoose.model('User', userSchema);
