/** Backend API base URL — set REACT_APP_API_URL in Vercel (e.g. https://your-api.com/api) */
const DEFAULT_DEV_API = 'http://localhost:5000/api';

const normalizeApiBaseUrl = (value) => {
  const trimmed = String(value || DEFAULT_DEV_API).trim().replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const API_BASE_URL = normalizeApiBaseUrl(process.env.REACT_APP_API_URL);

/** Origin without /api — used for PayHere notify fallback URLs */
export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api$/, '');
