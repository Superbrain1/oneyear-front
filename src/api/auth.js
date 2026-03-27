import api from './client';

export function registerUser(payload) {
  return api.post('/auth/register', payload);
}

export function loginUser(payload) {
  return api.post('/auth/login', payload);
}

export function googleAuth(payload) {
  return api.post('/auth/google', payload);
}

export function getMe() {
  return api.get('/auth/me');
}

export function updateMe(payload) {
  return api.put('/auth/me', payload);
}

export function listAdminUsers() {
  return api.get('/auth/admin/users');
}

export function updateAdminUserRole(userId, role) {
  return api.patch(`/auth/admin/users/${userId}/role`, { role });
}

export function updateAdminUser(userId, payload) {
  return api.put(`/auth/admin/users/${userId}`, payload);
}
