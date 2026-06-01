import api from './client';

export const getProviderPayments = async () => {
  const { data } = await api.get('/payment/provider');
  return data;
};
