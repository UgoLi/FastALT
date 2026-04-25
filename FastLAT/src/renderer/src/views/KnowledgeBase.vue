<template>
  <div class="knowledge-base">
    <h2 class="page-title">{{ t('knowledgeBase.title') }}</h2>

    <!-- Module Selection -->
    <div class="card">
      <div class="card-header">{{ t('knowledgeBase.selectModule') }}</div>
      <div class="module-selector">
        <select v-model="selectedModule" class="form-input" @change="loadEntries">
          <option value="">{{ t('knowledgeBase.selectModulePlaceholder') }}</option>
          <option v-for="module in modules" :key="module" :value="module">
            {{ module }}
          </option>
        </select>
        <button class="btn btn-secondary" @click="refreshModules">{{ t('common.refresh') }}</button>
      </div>

      <div v-if="selectedModule && statistics" class="statistics">
        <div class="stat-item">
          <span class="stat-label">{{ t('knowledgeBase.totalEntries') }}</span>
          <span class="stat-value">{{ statistics.totalEntries }}</span>
        </div>
        <div v-if="statistics.dateRange" class="stat-item">
          <span class="stat-label">{{ t('knowledgeBase.dateRange') }}</span>
          <span class="stat-value">
            {{ formatDate(statistics.dateRange.from) }} - {{ formatDate(statistics.dateRange.to) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Log Type Tabs -->
    <div v-if="selectedModule" class="card">
      <div class="tabs">
        <button
          :class="['tab', { active: activeTab === 'Normal' }]"
          @click="activeTab = 'Normal'; loadEntries()"
        >
          {{ t('knowledgeBase.normalLogs') }}
        </button>
        <button
          :class="['tab', { active: activeTab === 'Error' }]"
          @click="activeTab = 'Error'; loadEntries()"
        >
          {{ t('knowledgeBase.errorLogs') }}
        </button>
      </div>

      <!-- Search -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          class="form-input"
          :placeholder="t('knowledgeBase.searchEntries')"
          @input="searchEntries"
        />
      </div>

      <!-- Entries Table -->
      <div v-if="entries.length > 0" class="entries-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('knowledgeBase.timestamp') }}</th>
              <th>{{ t('knowledgeBase.content') }}</th>
              <th>{{ t('knowledgeBase.keywords') }}</th>
              <th>{{ t('knowledgeBase.source') }}</th>
              <th>{{ t('knowledgeBase.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in displayedEntries" :key="entry.id">
              <td class="timestamp-cell">{{ formatTimestamp(entry.timestamp) }}</td>
              <td class="content-cell">
                <div class="content-preview" :title="entry.cleanedContent">
                  {{ entry.cleanedContent.substring(0, 100) }}{{ entry.cleanedContent.length > 100 ? '...' : '' }}
                </div>
              </td>
              <td>
                <div class="keywords">
                  <span v-for="kw in entry.keywords.slice(0, 3)" :key="kw" class="badge badge-info">
                    {{ kw }}
                  </span>
                </div>
              </td>
              <td>{{ entry.metadata.sourceFile }}</td>
              <td>
                <button class="btn btn-secondary" @click="viewEntry(entry)">{{ t('knowledgeBase.view') }}</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination">
          <button class="btn btn-secondary" :disabled="currentPage === 1" @click="currentPage--">
            {{ t('common.previous') || 'Previous' }}
          </button>
          <span>{{ t('common.page') || 'Page' }} {{ currentPage }} / {{ totalPages }}</span>
          <button class="btn btn-secondary" :disabled="currentPage >= totalPages" @click="currentPage++">
            {{ t('common.next') || 'Next' }}
          </button>
        </div>
      </div>

      <p v-else class="empty-message">{{ t('common.noData') }}</p>
    </div>

    <!-- JSON View -->
    <div v-if="viewMode === 'json'" class="card">
      <div class="card-header">
        {{ t('knowledgeBase.jsonView') }}
        <button class="btn btn-secondary" style="float: right;" @click="viewMode = 'table'">{{ t('knowledgeBase.tableView') }}</button>
      </div>
      <pre class="json-view">{{ jsonContent }}</pre>
    </div>

    <!-- Entry Detail Modal -->
    <div v-if="selectedEntry" class="modal-overlay" @click.self="selectedEntry = null">
      <div class="modal modal-large">
        <div class="modal-header">
          <h3>{{ t('knowledgeBase.entryDetails') }}</h3>
          <button class="close-btn" @click="selectedEntry = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="entry-detail">
            <div class="detail-row">
              <span class="detail-label">{{ t('knowledgeBase.id') }}:</span>
              <span class="detail-value">{{ selectedEntry.id }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('knowledgeBase.timestamp') }}:</span>
              <span class="detail-value">{{ selectedEntry.timestamp }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('knowledgeBase.source') }}:</span>
              <span class="detail-value">{{ selectedEntry.metadata.sourceFile }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ t('knowledgeBase.lineNumber') }}:</span>
              <span class="detail-value">{{ selectedEntry.metadata.lineNumber }}</span>
            </div>
            <div v-if="selectedEntry.metadata.errorCode" class="detail-row">
              <span class="detail-label">{{ t('knowledgeBase.errorCode') }}:</span>
              <span class="detail-value error-code">{{ selectedEntry.metadata.errorCode }}</span>
            </div>
            <div v-if="selectedEntry.metadata.severity" class="detail-row">
              <span class="detail-label">{{ t('knowledgeBase.severity') }}:</span>
              <span :class="['badge', getSeverityBadge(selectedEntry.metadata.severity)]">
                {{ selectedEntry.metadata.severity }}
              </span>
            </div>
            <div class="detail-section">
              <span class="detail-label">{{ t('knowledgeBase.rawContent') }}:</span>
              <pre class="raw-content">{{ selectedEntry.rawContent }}</pre>
            </div>
            <div class="detail-section">
              <span class="detail-label">{{ t('knowledgeBase.cleanedContent') }}:</span>
              <pre class="cleaned-content">{{ selectedEntry.cleanedContent }}</pre>
            </div>
            <div class="detail-section">
              <span class="detail-label">{{ t('knowledgeBase.keywords') }}:</span>
              <div class="keywords">
                <span v-for="kw in selectedEntry.keywords" :key="kw" class="badge badge-info">
                  {{ kw }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="exportEntry">{{ t('common.export') }}</button>
          <button class="btn btn-primary" @click="addToAnalysis">{{ t('knowledgeBase.addToAnalysis') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../i18n'

const { t } = useI18n()

interface KBEntry {
  id: string
  timestamp: string
  rawContent: string
  cleanedContent: string
  keywords: string[]
  metadata: {
    moduleName: string
    type: 'Normal' | 'Error'
    sourceFile: string
    lineNumber: number
    errorCode?: string
    severity?: string
  }
}

const modules = ref<string[]>([])
const selectedModule = ref('')
const activeTab = ref<'Normal' | 'Error'>('Normal')
const entries = ref<KBEntry[]>([])
const searchQuery = ref('')
const viewMode = ref<'table' | 'json'>('table')
const selectedEntry = ref<KBEntry | null>(null)
const statistics = ref<{ totalEntries: number; dateRange?: { from: string; to: string } } | null>(null)

const pageSize = 50
const currentPage = ref(1)

const displayedEntries = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return entries.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.ceil(entries.value.length / pageSize))

const jsonContent = computed(() => {
  return JSON.stringify({ module: selectedModule.value, type: activeTab.value, entries: entries.value }, null, 2)
})

onMounted(async () => {
  await refreshModules()
})

async function refreshModules() {
  modules.value = await window.api.knowledgeBase.getModules()
}

async function loadEntries() {
  if (!selectedModule.value) return

  if (searchQuery.value) {
    entries.value = await window.api.knowledgeBase.searchEntries(
      searchQuery.value,
      [selectedModule.value]
    )
  } else {
    entries.value = await window.api.knowledgeBase.getEntries(
      selectedModule.value,
      activeTab.value,
      { limit: 1000 }
    )
  }

  statistics.value = await window.api.knowledgeBase.getStatistics(selectedModule.value)
  currentPage.value = 1
}

async function searchEntries() {
  await loadEntries()
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return date
  }
}

function getSeverityBadge(severity: string): string {
  switch (severity?.toLowerCase()) {
    case 'critical':
    case 'high':
      return 'badge-error'
    case 'medium':
      return 'badge-warning'
    case 'low':
      return 'badge-success'
    default:
      return 'badge-info'
  }
}

function viewEntry(entry: KBEntry) {
  selectedEntry.value = entry
}

async function exportEntry() {
  if (!selectedEntry.value) return
  const json = JSON.stringify(selectedEntry.value, null, 2)
  await navigator.clipboard.writeText(json)
  alert('Entry copied to clipboard')
}

const router = useRouter()

function addToAnalysis() {
  if (!selectedEntry.value) return
  // Navigate to analysis with this entry
  router.push({ name: 'analysis', query: { entryId: selectedEntry.value.id } })
}
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.module-selector {
  display: flex;
  gap: 12px;
  align-items: center;
}

.module-selector .form-input {
  max-width: 300px;
}

.statistics {
  display: flex;
  gap: 32px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.tab:hover {
  background: #f9fafb;
}

.tab.active {
  background: #2563eb;
  color: white;
  border-color: #2563eb;
}

.search-bar {
  margin-bottom: 16px;
}

.timestamp-cell {
  white-space: nowrap;
  font-size: 13px;
  color: #6b7280;
}

.content-cell {
  max-width: 400px;
}

.content-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.keywords {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.json-view {
  background: #1f2937;
  color: #e5e7eb;
  padding: 20px;
  border-radius: 8px;
  overflow-x: auto;
  max-height: 500px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}

.modal-large {
  width: 700px;
}

.entry-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
  min-width: 120px;
}

.detail-value {
  font-family: monospace;
  font-size: 13px;
}

.detail-section {
  margin-top: 8px;
}

.detail-section .detail-label {
  display: block;
  margin-bottom: 8px;
}

.raw-content,
.cleaned-content {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  font-family: monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-code {
  color: #dc2626;
  font-weight: 600;
}

.empty-message {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}
</style>
