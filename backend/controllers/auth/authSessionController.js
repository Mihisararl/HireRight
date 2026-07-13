import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { buildAuthUserResponse, normalizeEmail, signAuthToken } from '../../utils/authHelpers.js';

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
