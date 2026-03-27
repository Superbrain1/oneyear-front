import axios from 'axios';

const isLocalHost = typeof window !== 'undefined' && (
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === 'localhost'
);

const defaultBaseURL = isLocalHost ? 'http://127.0.0.1:3000/api' : '/api';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE || defaultBaseURL,
  timeout: 10000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
