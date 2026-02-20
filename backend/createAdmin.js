import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
    try {
        const existing = await User.findOne({ email: 'admin@hireright.lk' });

        if (existing) {
            console.log('Admin already exists');
            process.exit();
        }

        const admin = new User({
            name: 'System Administrator',
            email: 'admin@hireright.lk',
            phone: '0710000000',
            password: 'Admin@123',
            role: 'admin'
        });

        await admin.save();

        console.log('Admin created successfully');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

createAdmin();
