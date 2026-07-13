import User from '../../models/User.js';
import crypto from 'crypto';
import {
  buildVerificationEmailHtml,
  buildVerificationUrl,
  sendEmail
} from '../../services/emailService.js';

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

    const verifyUrl = buildVerificationUrl(verificationToken);

    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your HireRight Account',
        html: buildVerificationEmailHtml({ name, verifyUrl }),
        context: 'verification'
      });
    } catch (emailErr) {
      await User.findByIdAndDelete(user._id);
      console.error('Register verification email failed:', emailErr.message);
      if (emailErr.mailError) {
        console.error('Register SMTP error details:', emailErr.mailError);
      }
      return res.status(500).json({
        message: 'Failed to send verification email. Please try again later.',
        ...(process.env.NODE_ENV !== 'production' && emailErr.message
          ? { detail: emailErr.message }
          : {})
      });
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.'
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
