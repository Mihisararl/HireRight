import api from '../utils/api';

export const updateProviderLocation = async (lat, lng) => {
  const response = await api.post('/provider/update-location', { lat, lng });
  return response.data;
};

export const startProviderJourney = async (serviceRequestId) => {
  const response = await api.post('/provider/start-journey', { serviceRequestId });
  return response.data;
};

export const getProviderLocation = async (providerUserId) => {
  const response = await api.get(`/provider/${providerUserId}/location`);
  return response.data;
};
