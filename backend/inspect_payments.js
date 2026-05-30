import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/hi/Desktop/HireRight/backend/.env' });

const Payment = mongoose.model('Payment', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  providerId: mongoose.Schema.Types.ObjectId,
  serviceRequestId: mongoose.Schema.Types.ObjectId,
  amount: Number,
  status: String,
}));

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/HireRight');
  const payments = await Payment.find({});
  console.log('--- ALL PAYMENTS ---');
  console.log(JSON.stringify(payments, null, 2));
  await mongoose.disconnect();
}

run().catch(console.error);
