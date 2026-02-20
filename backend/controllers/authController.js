import User from '../models/User.js';
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

    const user = new User({
      name,
      email,
      phone,
      district,
      postalCode,
      password,
      role: role || 'customer',
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

    // BLOCK IF NOT VERIFIED
    if (!user.isVerified) {
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
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
