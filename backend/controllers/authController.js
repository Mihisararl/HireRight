import User from '../models/User.js';
import UserPaymentDetails from '../models/UserPaymentDetails.js';
import Provider from '../models/Provider.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET;

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const {
      name, email, phone, district, postalCode,
      password, role
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: 'Name, email, phone and password are required.'
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const normalizedRole = role || 'customer';
    const user = new User({
      name,
      email,
      phone,
      district,
      postalCode,
      password,
      role: normalizedRole,
      providerStatus: normalizedRole === 'provider' ? 'pending' : undefined,
      verificationToken,
      verificationExpires: Date.now() + 24 * 60 * 60 * 1000,
      isVerified: false
    });

    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;

    console.log("Sending verification email to:", email);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: "Verify Your HireRight Account",
      html: `
        <h2>Welcome to HireRight, ${name}!</h2>
        <p>Please verify your email by clicking below:</p>
        <a href="${verifyUrl}"
           style="display:inline-block;padding:10px 20px;background:#0066ff;color:#fff;text-decoration:none;border-radius:5px;">
           Verify Email
        </a>
        <p>If button doesn't work, copy this link:</p>
        <p>${verifyUrl}</p>
        <p>This link expires in 24 hours.</p>
      `
    });

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account."
    });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= VERIFY EMAIL =================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;

    await user.save();

    res.json({ message: "Email verified successfully" });

  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // BLOCK IF NOT VERIFIED (admins can bypass)
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(401).json({
        message: "Please verify your email before logging in."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        postalCode: user.postalCode,
        profilePhoto: user.profilePhoto,
        role: user.role,
        providerStatus: user.providerStatus
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= CURRENT USER =================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resp = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      postalCode: user.postalCode,
      profilePhoto: user.profilePhoto,
      role: user.role,
      providerStatus: user.providerStatus,
      serviceCategory: user.serviceCategory,
      yearsOfExperience: user.yearsOfExperience,
      hourlyRate: user.hourlyRate,
      professionalBio: user.professionalBio,
      portfolioPhoto: user.portfolioPhoto,
      city: user.city,
      district: user.district
    };

    if (user.role === 'provider') {
      const providerDoc = await Provider.findOne({ userId: user._id });
      if (providerDoc) {
        resp.bankName = providerDoc.bankName || '';
        resp.accountNumber = providerDoc.accountNumber || '';
        resp.accountHolderName = providerDoc.accountHolderName || '';
        resp.branch = providerDoc.branch || '';
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        resp.isAvailableToday = !(
          providerDoc.availabilityDate === todayStr && providerDoc.isAvailableToday === false
        );
        resp.availabilityDate = providerDoc.availabilityDate || '';
      }
    } else {
      const bankDetails = await UserPaymentDetails.findOne({ userId: user._id });
      if (bankDetails) {
        resp.bankName = bankDetails.bankName || '';
        resp.accountNumber = bankDetails.accountNumber || '';
        resp.accountHolderName = bankDetails.accountHolderName || '';
        resp.branch = bankDetails.branch || '';
      }
    }

    res.json({ user: resp });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= UPDATE PROFILE =================
export const updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      postalCode,
      profilePhoto,
      serviceCategory,
      yearsOfExperience,
      hourlyRate,
      professionalBio,
      portfolioPhoto,
      city,
      district,
      bankName,
      accountNumber,
      accountHolderName,
      branch
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (postalCode !== undefined) user.postalCode = postalCode;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    if (user.role === 'provider') {
      if (serviceCategory !== undefined) user.serviceCategory = serviceCategory;
      if (yearsOfExperience !== undefined) user.yearsOfExperience = Number(yearsOfExperience) || 0;
      if (hourlyRate !== undefined) user.hourlyRate = Number(hourlyRate) || 0;
      if (professionalBio !== undefined) user.professionalBio = professionalBio;
      if (portfolioPhoto !== undefined) user.portfolioPhoto = portfolioPhoto;
      if (city !== undefined) user.city = city;
      if (district !== undefined) user.district = district;
    }

    await user.save();

    if (user.role === 'provider') {
      const providerDoc = await Provider.findOne({ userId: user._id });
      if (providerDoc) {
        if (name !== undefined && String(name).trim() !== '') {
          const parts = name.trim().split(/\s+/);
          providerDoc.firstName = parts[0] || providerDoc.firstName;
          providerDoc.lastName = parts.slice(1).join(' ') || providerDoc.lastName;
        }
        if (email !== undefined) providerDoc.email = email;
        if (phone !== undefined) providerDoc.phone = phone;
        if (district !== undefined) providerDoc.district = district;
        if (city !== undefined) providerDoc.city = city;
        if (postalCode !== undefined) providerDoc.postalCode = postalCode;
        if (serviceCategory !== undefined) providerDoc.serviceCategory = serviceCategory;
        if (yearsOfExperience !== undefined) providerDoc.yearsOfExperience = Number(yearsOfExperience) || 0;
        if (hourlyRate !== undefined) providerDoc.hourlyRate = Number(hourlyRate) || 0;
        if (professionalBio !== undefined) providerDoc.professionalBio = professionalBio;
        if (portfolioPhoto !== undefined) providerDoc.portfolioPhoto = portfolioPhoto;

        if (bankName !== undefined) providerDoc.bankName = bankName;
        if (accountNumber !== undefined) providerDoc.accountNumber = accountNumber;
        if (branch !== undefined) providerDoc.branch = branch;
        if (accountHolderName !== undefined) providerDoc.accountHolderName = accountHolderName;

        await providerDoc.save();
      }
    }

    const bankFields = { bankName, accountNumber, accountHolderName, branch };
    const hasBankDetails = Object.values(bankFields).some((value) => Boolean(value));

    if (hasBankDetails) {
      const missing = Object.entries(bankFields)
        .filter(([, value]) => !value)
        .map(([key]) => key);

      if (missing.length > 0) {
        return res.status(400).json({
          message: `Missing required bank fields: ${missing.join(', ')}`
        });
      }

      await UserPaymentDetails.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          postalCode: user.postalCode,
          bankName,
          accountNumber,
          accountHolderName,
          branch
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        postalCode: user.postalCode,
        profilePhoto: user.profilePhoto,
        role: user.role,
        providerStatus: user.providerStatus,
        serviceCategory: user.serviceCategory,
        yearsOfExperience: user.yearsOfExperience,
        hourlyRate: user.hourlyRate,
        professionalBio: user.professionalBio,
        portfolioPhoto: user.portfolioPhoto,
        city: user.city,
        district: user.district
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
