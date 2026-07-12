// web-frontend/src/api/auth.js

import api from '../utils/api';

export const verifyEmailToken = async (token) => {
  const response = await api.get(`/auth/verify/${token}`);
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const validatePasswordResetToken = async (token) => {
  const response = await api.get(`/auth/reset-password/${token}`);
  return response.data;
};

export const resetPasswordWithToken = async ({ token, password, confirmPassword }) => {
  const response = await api.post('/auth/reset-password', { token, password, confirmPassword });
  return response.data;
};

export const loginWithGoogle = async (credential, role = 'customer') => {
  const response = await api.post('/auth/google', { credential, role });
  return response.data;
};
