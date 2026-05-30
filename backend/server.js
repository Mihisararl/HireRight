// server.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import serviceRequestRoutes from './routes/serviceRequestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import User from './models/User.js';

const app = express();

// ✅ CORS setup
const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options('*', cors({ origin: allowedOrigins, credentials: true }));

// ✅ FIX: Increase payload size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', serviceRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reviews', reviewRoutes);

// ✅ Start server
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');

    // ✅ Ensure default admin exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hireright.lk';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const admin = new User({
        name: 'Administrator',
        email: adminEmail,
        phone: '0770000000',
        district: '',
        postalCode: '',
        password: adminPassword,
        role: 'admin',
      });

      await admin.save();
      console.log('Default admin account created:', adminEmail);
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

start();