import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
};

export const buildAuthUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address,
  postalCode: user.postalCode,
  profilePhoto: user.profilePhoto,
  role: user.role,
  providerStatus: user.providerStatus,
  needsProfileCompletion: Boolean(user.needsPhone)
});

export const signAuthToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  getJwtSecret(),
  { expiresIn: '1d' }
);
