import User from '../models/User.js';
import UserPaymentDetails from '../models/UserPaymentDetails.js';
import Provider from '../models/Provider.js';
import WorkerRegistrationRequest from '../models/WorkerRegistrationRequest.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import { buildAuthUserResponse, signAuthToken } from '../utils/authHelpers.js';
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetUrl,
  buildVerificationEmailHtml,
  buildVerificationUrl,
  sendEmail
} from '../services/emailService.js';
import { resolveRateFields, applyResolvedRate } from '../utils/rateUtils.js';

dotenv.config();

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

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const isStrongEnoughPassword = (password) => typeof password === 'string' && password.length >= 6;

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const genericMessage =
      'If an account exists for that email, you will receive a password reset link shortly.';

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (user && user.authProvider === 'google') {
      return res.json({ message: genericMessage });
    }

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
      await user.save();

      const resetUrl = buildPasswordResetUrl(resetToken);

      try {
        await sendEmail({
          to: email,
          subject: 'Reset your HireRight password',
          html: buildPasswordResetEmailHtml({ name: user.name, resetUrl }),
          context: 'password-reset'
        });
      } catch (emailErr) {
        console.error('forgotPassword email error:', emailErr.message);
        if (emailErr.mailError) {
          console.error('forgotPassword SMTP error details:', emailErr.mailError);
        }
        return res.status(500).json({
          message: 'Failed to send reset email. Please try again later.',
          ...(process.env.NODE_ENV !== 'production' && emailErr.message
            ? { detail: emailErr.message }
            : {})
        });
      }
    }

    res.json({ message: genericMessage });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= VALIDATE RESET TOKEN =================
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).select('email');

    if (!user) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired reset link' });
    }

    res.json({ valid: true, email: user.email });
  } catch (err) {
    console.error('validateResetToken error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= RESET PASSWORD =================
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body || {};

    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }

    if (!isStrongEnoughPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.authProvider === 'google') {
      return res.status(400).json({
        message: 'This account uses Google sign-in. Please continue with Google.'
      });
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

    const token = signAuthToken(user);

    res.json({
      token,
      user: buildAuthUserResponse(user)
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const ALLOWED_GOOGLE_ROLES = ['customer', 'provider'];

const roleMismatchMessage = (existingRole, requestedRole) => {
  if (existingRole === 'customer') {
    return 'This email is registered as a service receiver. Sign in with Google as a customer, or use email and password.';
  }
  if (existingRole === 'provider') {
    return 'This email is registered as a service provider. Sign in with Google as a provider, or use email and password.';
  }
  return 'This account cannot use Google sign-in for the selected role.';
};

// ================= GOOGLE (CUSTOMERS & PROVIDERS) =================
export const googleAuth = async (req, res) => {
  try {
    const { credential, role: requestedRole } = req.body || {};
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const role = ALLOWED_GOOGLE_ROLES.includes(requestedRole) ? requestedRole : 'customer';

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      return res.status(500).json({ message: 'Google sign-in is not configured on the server' });
    }

    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(400).json({ message: 'Google account email is not available' });
    }

    if (payload.email_verified === false) {
      return res.status(400).json({ message: 'Google email is not verified' });
    }

    const email = normalizeEmail(payload.email);
    const googleId = payload.sub;
    const name = payload.name || email.split('@')[0];
    const picture = payload.picture;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (user.role === 'admin') {
        return res.status(403).json({ message: 'Admin accounts cannot use Google sign-in' });
      }

      if (user.role !== role) {
        return res.status(403).json({ message: roleMismatchMessage(user.role, role) });
      }

      if (user.googleId && user.googleId !== googleId) {
        return res.status(400).json({ message: 'Google account does not match this email' });
      }

      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.authProvider || user.authProvider === 'local') {
          user.authProvider = 'both';
        }
        if (picture && !user.profilePhoto) user.profilePhoto = picture;
        user.isVerified = true;
        await user.save();
      }
    } else {
      const newUser = {
        name,
        email,
        phone: '0000000000',
        password: crypto.randomBytes(32).toString('hex'),
        role,
        googleId,
        authProvider: 'google',
        profilePhoto: picture,
        isVerified: true,
        needsPhone: true
      };

      if (role === 'provider') {
        newUser.providerStatus = 'pending';
      }

      user = new User(newUser);
      await user.save();
    }

    const token = signAuthToken(user);

    res.json({
      token,
      user: buildAuthUserResponse(user)
    });
  } catch (err) {
    console.error('googleAuth error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An account with this email or Google ID already exists' });
    }
    const isDev = process.env.NODE_ENV !== 'production';
    res.status(401).json({
      message: 'Google sign-in failed. Please try again.',
      ...(isDev && err.message ? { detail: err.message } : {})
    });
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
      dailyRate: user.dailyRate,
      rateType: user.rateType || 'hourly',
      professionalBio: user.professionalBio,
      portfolioPhoto: user.portfolioPhoto,
      city: user.city,
      district: user.district,
      needsProfileCompletion: Boolean(user.needsPhone)
    };

    if (user.role === 'provider') {
      const registrationRequest = await WorkerRegistrationRequest.findOne({
        email: user.email
      }).select('status');

      resp.workerProfileSubmitted = Boolean(registrationRequest);
      resp.workerRegistrationStatus = registrationRequest?.status || null;

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
      dailyRate,
      rateType,
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
    if (phone !== undefined) {
      const trimmedPhone = String(phone).trim();
      if (user.needsPhone && !trimmedPhone) {
        return res.status(400).json({ message: 'Phone number is required' });
      }
      user.phone = trimmedPhone;
      if (trimmedPhone && user.needsPhone) {
        user.needsPhone = false;
      }
    }
    if (address !== undefined) user.address = address;
    if (postalCode !== undefined) user.postalCode = postalCode;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (district !== undefined) user.district = district;

    if (user.role === 'provider') {
      if (serviceCategory !== undefined) user.serviceCategory = serviceCategory;
      if (yearsOfExperience !== undefined) user.yearsOfExperience = Number(yearsOfExperience) || 0;

      const rateFieldsProvided = [rateType, hourlyRate, dailyRate].some((value) => value !== undefined);
      if (rateFieldsProvided) {
        const resolvedRate = resolveRateFields({ rateType, hourlyRate, dailyRate });
        if (resolvedRate.error) {
          return res.status(400).json({ message: resolvedRate.error });
        }
        applyResolvedRate(user, resolvedRate);
      }

      if (professionalBio !== undefined) user.professionalBio = professionalBio;
      if (portfolioPhoto !== undefined) user.portfolioPhoto = portfolioPhoto;
      if (city !== undefined) user.city = city;
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

        if (rateFieldsProvided) {
          const resolvedRate = resolveRateFields({ rateType, hourlyRate, dailyRate });
          applyResolvedRate(providerDoc, resolvedRate);
        }

        if (professionalBio !== undefined) providerDoc.professionalBio = professionalBio;
        if (portfolioPhoto !== undefined) providerDoc.portfolioPhoto = portfolioPhoto;

        const bankFieldsInRequest = [bankName, accountNumber, branch, accountHolderName]
          .some((value) => value !== undefined);
        if (bankFieldsInRequest) {
          const trimmedBank = {
            bankName: bankName !== undefined ? String(bankName).trim() : undefined,
            accountNumber: accountNumber !== undefined ? String(accountNumber).trim() : undefined,
            branch: branch !== undefined ? String(branch).trim() : undefined,
            accountHolderName: accountHolderName !== undefined ? String(accountHolderName).trim() : undefined
          };
          const hasAnyBankValue = Object.values(trimmedBank).some(Boolean);
          if (hasAnyBankValue) {
            const missing = Object.entries(trimmedBank)
              .filter(([, value]) => !value)
              .map(([key]) => key);
            if (missing.length > 0) {
              return res.status(400).json({
                message: `Missing required bank fields: ${missing.join(', ')}`
              });
            }
            providerDoc.bankName = trimmedBank.bankName;
            providerDoc.accountNumber = trimmedBank.accountNumber;
            providerDoc.branch = trimmedBank.branch;
            providerDoc.accountHolderName = trimmedBank.accountHolderName;
          }
        }

        await providerDoc.save();
      }
    }

    const bankFields = {
      bankName: bankName !== undefined ? String(bankName).trim() : undefined,
      accountNumber: accountNumber !== undefined ? String(accountNumber).trim() : undefined,
      accountHolderName: accountHolderName !== undefined ? String(accountHolderName).trim() : undefined,
      branch: branch !== undefined ? String(branch).trim() : undefined
    };
    const hasBankDetails = Object.values(bankFields).some(Boolean);

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
        dailyRate: user.dailyRate,
        rateType: user.rateType || 'hourly',
        professionalBio: user.professionalBio,
        portfolioPhoto: user.portfolioPhoto,
        city: user.city,
        district: user.district,
        needsProfileCompletion: Boolean(user.needsPhone)
      }
    });
  } catch (err) {
    console.error('updateProfile error:', err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ message: messages });
    }
    res.status(500).json({ message: 'Server error' });
  }
};
