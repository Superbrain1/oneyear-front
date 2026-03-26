import axios from 'axios';

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE || 'http://127.0.0.1:3000/api',
  timeout: 10000
});

export default api;
