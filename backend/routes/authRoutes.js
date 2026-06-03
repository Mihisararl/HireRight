import express from 'express';
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  googleAuth,
  getMe,
  updateProfile
} from '../controllers/authController.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password/:token', validateResetToken);
router.post('/reset-password', resetPassword);
router.get('/verify/:token', verifyEmail);
router.get('/me', auth(), getMe);
router.put('/profile', auth(), updateProfile);

export default router;
