import api from '../utils/api';

export const createReview = async (payload) => {
  const response = await api.post('/reviews', payload);
  return response.data;
};

export const getUserReviews = async () => {
  const response = await api.get('/reviews/my');
  return response.data;
};

export const getReviewByServiceRequest = async (serviceRequestId) => {
  const response = await api.get(`/reviews/service/${serviceRequestId}`);
  return response.data;
};

export const getProviderReviews = async () => {
  const response = await api.get('/reviews/provider');
  return response.data;
};
