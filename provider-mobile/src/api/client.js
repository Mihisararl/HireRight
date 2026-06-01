import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import { getToken } from '../utils/storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getErrorMessage = (error, fallback = 'Something went wrong') => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  const isNetworkFailure =
    error?.code === 'ERR_NETWORK' ||
    error?.message === 'Network Error' ||
    error?.code === 'ECONNREFUSED';

  if (isNetworkFailure) {
    return `Cannot reach the backend at ${API_BASE_URL}. Make sure the backend is running (port 5000), your phone is on the same Wi‑Fi as your PC, and Windows Firewall allows Node.js.`;
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Request timed out. Check your network connection.';
  }

  return error?.message || fallback;
};

export default api;
