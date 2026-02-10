import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import TextWidthComparison from '@/views/TextWidthComparison.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/text-width-comparison',
      name: 'text-width-comparison',
      component: TextWidthComparison,
    },
  ],
})

export default router
