import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Home from '../views/Home.vue';
import Pokedex from '../views/Pokedex.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import PokemonDetail from '../views/PokemonDetail.vue';
import Favorites from '../views/Favorites.vue';
import Teams from '../views/Teams.vue';
import Friends from '../views/Friends.vue';
import Battle from '../views/Battle.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/pokedex', component: Pokedex },
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/register', component: Register, meta: { guest: true } },
  { path: '/pokemon/:id', component: PokemonDetail },
  { path: '/favorites', component: Favorites, meta: { requiresAuth: true } },
  { path: '/teams', component: Teams, meta: { requiresAuth: true } },
  { path: '/friends', component: Friends, meta: { requiresAuth: true } },
  { path: '/battle/:id', name: 'Battle', component: Battle, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  if (!authStore.user && authStore.token) {
    await authStore.fetchProfile();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
