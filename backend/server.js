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
import User from './models/User.js';

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.CLIENT_URLS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use('/api/auth', authRoutes);
app.use('/api', serviceRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/provider', providerRoutes);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Ensure default admin exists
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
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin account created:', adminEmail);
    }

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

start();
