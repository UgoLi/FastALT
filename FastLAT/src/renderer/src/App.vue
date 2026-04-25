<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="logo">
        <h1>FastLAT</h1>
        <span class="version">v1.0.0</span>
      </div>
      <nav class="nav-menu">
        <router-link to="/import" class="nav-item">
          <span class="nav-icon">📥</span>
          <span>{{ t('nav.logImport') }}</span>
        </router-link>
        <router-link to="/analysis" class="nav-item">
          <span class="nav-icon">🔍</span>
          <span>{{ t('nav.analysis') }}</span>
        </router-link>
        <router-link to="/knowledge-base" class="nav-item">
          <span class="nav-icon">📚</span>
          <span>{{ t('nav.knowledgeBase') }}</span>
        </router-link>
        <router-link to="/trend" class="nav-item">
          <span class="nav-icon">📈</span>
          <span>{{ t('nav.logTrend') }}</span>
        </router-link>
        <router-link to="/reports" class="nav-item">
          <span class="nav-icon">📋</span>
          <span>{{ t('nav.reports') }}</span>
        </router-link>
        <router-link to="/settings" class="nav-item">
          <span class="nav-icon">⚙️</span>
          <span>{{ t('nav.settings') }}</span>
        </router-link>
      </nav>
      <div class="language-switcher">
        <button
          :class="['lang-btn', { active: locale === 'en' }]"
          @click="locale = 'en'"
        >
          EN
        </button>
        <button
          :class="['lang-btn', { active: locale === 'zh' }]"
          @click="locale = 'zh'"
        >
          中文
        </button>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from './i18n'

const { locale, t } = useI18n()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #f3f4f6;
  color: #1f2937;
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background: #1f2937;
  color: white;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 0 20px 20px;
  border-bottom: 1px solid #374151;
  margin-bottom: 20px;
}

.logo h1 {
  font-size: 24px;
  font-weight: 700;
  color: #60a5fa;
}

.logo .version {
  font-size: 12px;
  color: #9ca3af;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  color: #d1d5db;
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: #374151;
  color: white;
}

.nav-item.router-link-active {
  background: #2563eb;
  color: white;
}

.nav-icon {
  font-size: 18px;
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* Common button styles */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* Card styles */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

/* Form styles */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Table styles */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  font-size: 13px;
  color: #6b7280;
}

.data-table tr:hover {
  background: #f9fafb;
}

/* Badge styles */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-error {
  background: #fee2e2;
  color: #991b1b;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-info {
  background: #dbeafe;
  color: #1e40af;
}

.language-switcher {
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid #374151;
  display: flex;
  gap: 8px;
}

.lang-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #4b5563;
  background: transparent;
  color: #9ca3af;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.lang-btn:hover {
  background: #374151;
  color: white;
}

.lang-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}
</style>
