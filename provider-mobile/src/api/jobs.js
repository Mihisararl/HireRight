import api from './client';

/** Assigned / accepted jobs (alias route + legacy web route) */
export const getProviderJobs = async () => {
  const { data } = await api.get('/provider/jobs');
  return data;
};

export const getAvailableJobs = async () => {
  const { data } = await api.get('/services/available');
  return data;
};

export const getDirectBookingRequests = async () => {
  const { data } = await api.get('/services/bookings/direct');
  return data;
};

export const sendOffer = async (jobId, offerData) => {
  const { data } = await api.post(`/services/${jobId}/accept`, offerData);
  return data;
};

export const acceptDirectBooking = async (jobId, responseMessage = '') => {
  const { data } = await api.post(`/services/${jobId}/accept-booking`, { responseMessage });
  return data;
};

export const rejectDirectBooking = async (jobId, responseMessage = '') => {
  const { data } = await api.post(`/services/${jobId}/reject-booking`, { responseMessage });
  return data;
};

export const completeJob = async (jobId) => {
  const { data } = await api.post(`/services/${jobId}/complete`);
  return data;
};
