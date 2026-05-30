import mongoose from 'mongoose';

const userPaymentDetailsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    accountHolderName: { type: String, required: true, trim: true },
    branch: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model('UserPaymentDetails', userPaymentDetailsSchema);
