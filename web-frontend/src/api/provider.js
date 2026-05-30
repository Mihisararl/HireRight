import api from '../utils/api';

export const registerProvider = async (providerData) => {
	const response = await api.post('/provider/register', providerData);
	return response.data;
};

export const getApprovedProviders = async () => {
	const response = await api.get('/provider/approved');
	return response.data;
};

export const getProvidersByCategory = async (category) => {
	const response = await api.get(`/provider/category/${category}`);
	return response.data;
};

export const getMyAvailability = async () => {
	const response = await api.get('/provider/availability/me');
	return response.data;
};

export const updateAvailability = async (isAvailableToday) => {
	const response = await api.put('/provider/availability', { isAvailableToday });
	return response.data;
};
