import { createRouter, createWebHistory } from 'vue-router'

const HomeView = () => import('@/views/Home.vue')
const ContactInsertView = () => import('@/views/Insert.vue')
const ContactDetailView = () => import('@/views/Detail.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/contacts/new', name: 'contacts-insert', component: ContactInsertView },
    { path: '/contacts/:id', name: 'contact-detail', component: ContactDetailView, props: true },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
