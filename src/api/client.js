import axios from 'axios';
import { reportClientError } from '../utils/errorReporter';

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    reportClientError({
      channel: 'axios',
      message: error.message,
      error: error.response
        ? {
            status: error.response.status,
            url: error.config?.url,
            method: error.config?.method,
            responseMessage: error.response.data?.message || ''
          }
        : {
            url: error.config?.url,
            method: error.config?.method
          }
    });
    return Promise.reject(error);
  }
);

export default api;
