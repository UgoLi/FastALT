import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'

// Import views
import LogImport from './views/LogImport.vue'
import LogAnalysis from './views/LogAnalysis.vue'
import KnowledgeBase from './views/KnowledgeBase.vue'
import ReportView from './views/ReportView.vue'
import LogTrend from './views/LogTrend.vue'
import Settings from './views/Settings.vue'

// Router configuration
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/import' },
    { path: '/import', name: 'import', component: LogImport },
    { path: '/analysis', name: 'analysis', component: LogAnalysis },
    { path: '/knowledge-base', name: 'kb', component: KnowledgeBase },
    { path: '/reports', name: 'reports', component: ReportView },
    { path: '/trend', name: 'trend', component: LogTrend },
    { path: '/settings', name: 'settings', component: Settings }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
