import api from '../utils/api';

export const createServiceRequest = async (data) => {
  const response = await api.post('/services', data);
  return response.data;
};

export const getUserServiceRequests = async () => {
  const response = await api.get('/services/user');
  return response.data;
};

export const getAllServiceRequests = async () => {
  const response = await api.get('/services');
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

export const getDirectBookingRequests = async () => {
  const response = await api.get('/services/bookings/direct');
  return response.data;
};

export const completeServiceRequest = async (id) => {
  const response = await api.post(`/services/${id}/complete`);
  return response.data;
};

export const completeServiceRequestByCustomer = async (id) => {
  const response = await api.post(`/services/${id}/complete-by-customer`);
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

export const submitDirectBookingEstimate = async (id, estimateData) => {
  const response = await api.post(`/services/${id}/submit-estimate`, estimateData);
  return response.data;
};

export const confirmDirectBookingProposal = async (id) => {
  const response = await api.post(`/services/${id}/confirm-proposal`);
  return response.data;
};

export const rejectDirectBookingProposal = async (id) => {
  const response = await api.post(`/services/${id}/reject-proposal`);
  return response.data;
};

export const rejectDirectBooking = async (id, responseMessage = '') => {
  const response = await api.post(`/services/${id}/reject-booking`, { responseMessage });
  return response.data;
};