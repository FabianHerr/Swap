import axios from 'axios';

const TOKEN_KEY = 'swap_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// One client for the whole app: base URL comes from env (localhost in dev, Render in prod)
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Attach the JWT to every request when we have one
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A 401 on a request that carried a token means the session expired: drop it and go to login.
// 403 ("not allowed", e.g. someone else's offer) is left for the page to handle.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      clearToken();
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
