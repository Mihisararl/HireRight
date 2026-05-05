import api from '../utils/api';

export const registerProvider = async (providerData) => {
	const response = await api.post('/provider/register', providerData);
	return response.data;
};
