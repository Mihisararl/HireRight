import api from '../utils/api';

export const getUserServiceRequests = async () => {
  const response = await api.get('/services/user');
  return response.data;
};

export const updateServiceRequest = async (id, data) => {
  const response = await api.put(`/services/${id}`, data);
  return response.data;
};

export const getAvailableServiceRequests = async () => {
  const response = await api.get('/services/available');
  return response.data;
};

export const acceptServiceRequest = async (id, offerData) => {
  const response = await api.post(`/services/${id}/accept`, offerData);
  return response.data;
};

export const getProviderServiceRequests = async () => {
  const response = await api.get('/services/provider');
  return response.data;
};

export const completeServiceRequest = async (id) => {
  const response = await api.post(`/services/${id}/complete`);
  return response.data;
};

export const acceptProviderOffer = async (id) => {
  const response = await api.post(`/services/${id}/accept-offer`);
  return response.data;
};

export const rejectProviderOffer = async (id) => {
  const response = await api.post(`/services/${id}/reject-offer`);
  return response.data;
};