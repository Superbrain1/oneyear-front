import api from './client';

export function fetchCirclesApi() {
  return api.get('/circles');
}

export function createCircleApi(payload) {
  return api.post('/circles', payload);
}

export function createInviteApi(circleId, payload) {
  return api.post(`/circles/${circleId}/invite`, payload);
}

export function joinCircleApi(payload) {
  return api.post('/circles/join', payload);
}
