import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';

const AuthView = () => import('../views/AuthView.vue');
const HomeView = () => import('../views/HomeView.vue');

const routes = [
  {
    path: '/',
    redirect: () => (store.getters['auth/isLoggedIn'] ? '/home' : '/auth')
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView,
    meta: { guestOnly: true }
  },
  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const loggedIn = store.getters['auth/isLoggedIn'];

  if (to.meta.requiresAuth && !loggedIn) {
    return { name: 'auth' };
  }

  if (to.meta.guestOnly && loggedIn) {
    return { name: 'home' };
  }

  return true;
});

export default router;
