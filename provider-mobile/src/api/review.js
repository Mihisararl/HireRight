import api from './client';

export const getProviderReviews = async () => {
  const { data } = await api.get('/reviews/provider');
  return data;
};
