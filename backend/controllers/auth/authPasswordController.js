import User from '../../models/User.js';
import crypto from 'crypto';
import {
  buildPasswordResetEmailHtml,
  buildPasswordResetUrl,
  sendEmail
} from '../../services/emailService.js';
import { normalizeEmail } from '../../utils/authHelpers.js';

const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

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
