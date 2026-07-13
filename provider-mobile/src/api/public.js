import api from './client';

export const getApprovedProviders = async () => {
  const { data } = await api.get('/provider/approved');
  return data;
};
