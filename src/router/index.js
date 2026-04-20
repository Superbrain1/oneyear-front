import { createRouter, createWebHistory } from 'vue-router';
import store from '../store';

const AuthView = () => import('../views/AuthView.vue');
const HomeView = () => import('../views/HomeView.vue');
const NewsDetailView = () => import('../views/NewsDetailView.vue');
const MatchDetailView = () => import('../views/MatchDetailView.vue');
const VenueDetailView = () => import('../views/VenueDetailView.vue');
const PostDetailView = () => import('../views/PostDetailView.vue');
const PostComposerView = () => import('../views/PostComposerView.vue');
const ActivityDetailView = () => import('../views/ActivityDetailView.vue');
const MarketplaceDetailView = () => import('../views/MarketplaceDetailView.vue');
const MessagesView = () => import('../views/MessagesView.vue');
const UserProfileView = () => import('../views/UserProfileView.vue');

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
  },
  {
    path: '/news/:id',
    name: 'news-detail',
    component: NewsDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/matches/:id',
    name: 'match-detail',
    component: MatchDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/venues/:id',
    name: 'venue-detail',
    component: VenueDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/:id',
    name: 'post-detail',
    component: PostDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/compose',
    name: 'compose',
    component: PostComposerView,
    meta: { requiresAuth: true }
  },
  {
    path: '/activities/:id',
    name: 'activity-detail',
    component: ActivityDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/marketplace/:id',
    name: 'marketplace-detail',
    component: MarketplaceDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/messages',
    name: 'messages',
    component: MessagesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/users/:id',
    name: 'user-profile',
    component: UserProfileView,
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
