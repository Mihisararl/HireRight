import api from './client';

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const loginWithGoogle = async (credential) => {
  const { data } = await api.post('/auth/google', { credential, role: 'provider' });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data.user;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put('/auth/profile', payload);
  return data;
};
