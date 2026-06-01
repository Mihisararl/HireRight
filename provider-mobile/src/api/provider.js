import api from './client';

export const getMyAvailability = async () => {
  const { data } = await api.get('/provider/availability/me');
  return data;
};

export const updateAvailability = async (isAvailableToday) => {
  const { data } = await api.put('/provider/availability', { isAvailableToday });
  return data;
};

export const startJourney = async (serviceRequestId) => {
  const { data } = await api.post('/provider/start-journey', { serviceRequestId });
  return data;
};

export const updateLocation = async (lat, lng) => {
  const { data } = await api.post('/provider/update-location', { lat, lng });
  return data;
};
