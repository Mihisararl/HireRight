import api from '../utils/api';

export const getPayhereHash = async (payload) => {
  const response = await api.post('/payment/payhere-hash', payload);
  return response.data;
};

export const confirmPayment = async (payload) => {
  const response = await api.post('/payment/confirm', payload);
  return response.data;
};

export const getProviderPayments = async () => {
  const response = await api.get('/payment/provider');
  return response.data;
};

export const getUserPayments = async () => {
  const response = await api.get('/payment/user');
  return response.data;
};
