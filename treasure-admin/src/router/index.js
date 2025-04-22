import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue')
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard/home'
        },
        {
          path: 'home',
          name: 'Home',
          component: () => import('../views/Home.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'treasure',
          name: 'TreasureManage',
          component: () => import('../views/Treasure.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'treasure/add',
          name: 'TreasureAdd',
          component: () => import('../views/TreasureEdit.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'treasure/edit/:id',
          name: 'TreasureEdit',
          component: () => import('../views/TreasureEdit.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'user',
          name: 'UserManage',
          component: () => import('../views/User.vue'),
          meta: { requiresAuth: true }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue')
    }
  ]
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router; 