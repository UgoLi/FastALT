<template>
  <div class="settings">
    <h2 class="page-title">{{ t('settings.title') }}</h2>

    <!-- LLM Configuration -->
    <div class="card">
      <div class="card-header">{{ t('settings.llmConfig') }}</div>

      <div class="form-group">
        <label class="form-label">{{ t('settings.provider') }}</label>
        <select v-model="llmConfig.provider" class="form-input">
          <option value="ollama">Ollama (Local)</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
      </div>

      <div v-if="llmConfig.provider === 'ollama'" class="provider-settings">
        <div class="form-group">
          <label class="form-label">{{ t('settings.baseURL') }}</label>
          <input
            v-model="llmConfig.baseURL"
            class="form-input"
            placeholder="http://localhost:11434"
          />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('settings.model') }}</label>
          <input
            v-model="llmConfig.model"
            class="form-input"
            placeholder="qwen3.5:9b"
          />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('settings.embeddingModel') }}</label>
          <input
            v-model="llmConfig.embeddingModel"
            class="form-input"
            placeholder="nomic-embed-text"
          />
        </div>
      </div>

      <div v-if="llmConfig.provider === 'openai'" class="provider-settings">
        <div class="form-group">
          <label class="form-label">{{ t('settings.apiKey') }}</label>
          <input
            v-model="llmConfig.apiKey"
            type="password"
            class="form-input"
            placeholder="sk-..."
          />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('settings.baseURL') }} (optional)</label>
          <input
            v-model="llmConfig.baseURL"
            class="form-input"
            placeholder="https://api.openai.com/v1"
          />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('settings.model') }}</label>
          <input
            v-model="llmConfig.model"
            class="form-input"
            placeholder="gpt-4o"
          />
        </div>
      </div>

      <div v-if="llmConfig.provider === 'anthropic'" class="provider-settings">
        <div class="form-group">
          <label class="form-label">{{ t('settings.apiKey') }}</label>
          <input
            v-model="llmConfig.apiKey"
            type="password"
            class="form-input"
            placeholder="sk-ant-..."
          />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('settings.model') }}</label>
          <input
            v-model="llmConfig.model"
            class="form-input"
            placeholder="claude-sonnet-4-20250514"
          />
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" @click="testConnection">{{ t('settings.testConnection') }}</button>
        <button class="btn btn-primary" @click="saveConfig">{{ t('common.save') }}</button>
      </div>

      <div v-if="connectionStatus" class="connection-status" :class="connectionStatus.ok ? 'success' : 'error'">
        {{ connectionStatus.ok ? t('settings.connectionSuccess') : `${t('settings.connectionFailed')}: ${connectionStatus.error}` }}
        <span v-if="connectionStatus.latency"> (${connectionStatus.latency}ms)</span>
      </div>
    </div>

    <!-- Data Management -->
    <div class="card">
      <div class="card-header">{{ t('settings.dataManagement') }}</div>

      <div class="data-stats">
        <div class="stat-item">
          <span class="stat-label">{{ t('settings.kbSize') }}</span>
          <span class="stat-value">{{ dataStats.kbSize }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('settings.moduleCount') }}</span>
          <span class="stat-value">{{ dataStats.moduleCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">{{ t('settings.reportsCount') }}</span>
          <span class="stat-value">{{ dataStats.reportsCount }}</span>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-secondary" @click="openDataFolder">{{ t('settings.openDataFolder') }}</button>
        <button class="btn btn-danger" @click="confirmClearKB">{{ t('settings.clearKB') }}</button>
      </div>
    </div>

    <!-- About -->
    <div class="card">
      <div class="card-header">{{ t('settings.about') }}</div>
      <div class="about-info">
        <p><strong>FastLAT</strong> - Fast Log Analysis Tool</p>
        <p>{{ t('common.version') || 'Version' }}: {{ appVersion }}</p>
        <p class="about-desc">
          {{ t('settings.aboutDesc') }}
        </p>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ t('common.confirm') || 'Confirm Action' }}</h3>
          <button class="close-btn" @click="showConfirm = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ confirmMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showConfirm = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-danger" @click="executeConfirm">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

interface LLMConfig {
  provider: 'ollama' | 'openai' | 'anthropic'
  baseURL?: string
  apiKey?: string
  model: string
  embeddingModel?: string
}

interface ConnectionStatus {
  ok: boolean
  latency?: number
  error?: string
}

interface DataStats {
  kbSize: string
  moduleCount: number
  reportsCount: number
}

const llmConfig = ref<LLMConfig>({
  provider: 'ollama',
  baseURL: 'http://localhost:11434',
  model: 'qwen3.5:9b',
  embeddingModel: 'nomic-embed-text'
})

const connectionStatus = ref<ConnectionStatus | null>(null)
const appVersion = ref('1.0.0')
const dataStats = ref<DataStats>({
  kbSize: '0 KB',
  moduleCount: 0,
  reportsCount: 0
})

const showConfirm = ref(false)
const confirmMessage = ref('')
const confirmAction = ref<() => void>(() => {})

onMounted(async () => {
  await loadConfig()
  await loadStats()
  appVersion.value = await window.api.util.getAppVersion()
})

async function loadConfig() {
  const config = await window.api.llm.getConfig()
  if (config) {
    llmConfig.value = config
  }
}

async function saveConfig() {
  await window.api.llm.saveConfig(llmConfig.value)
  alert('Configuration saved successfully!')
}

async function testConnection() {
  connectionStatus.value = null
  const status = await window.api.llm.healthCheck()
  connectionStatus.value = status
}

async function loadStats() {
  const modules = await window.api.knowledgeBase.getModules()
  const reports = await window.api.report.getReports()

  // Calculate approximate KB size
  let totalSize = 0
  for (const module of modules) {
    const normal = await window.api.knowledgeBase.getEntries(module, 'Normal', { limit: 10000 })
    const error = await window.api.knowledgeBase.getEntries(module, 'Error', { limit: 10000 })
    totalSize += JSON.stringify(normal).length + JSON.stringify(error).length
  }

  dataStats.value = {
    kbSize: formatBytes(totalSize),
    moduleCount: modules.length,
    reportsCount: reports.length
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function openDataFolder() {
  await window.api.util.selectDirectory()
}

function confirmClearKB() {
  confirmMessage.value = t('settings.clearKBConfirm')
  confirmAction.value = async () => {
    // Would need IPC to actually clear the data
    alert('Knowledge base clearing is not implemented yet.')
    showConfirm.value = false
  }
  showConfirm.value = true
}

function executeConfirm() {
  confirmAction.value()
}
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.provider-settings {
  padding-left: 20px;
  border-left: 3px solid #e5e7eb;
  margin: 16px 0;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.connection-status {
  margin-top: 12px;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
}

.connection-status.success {
  background: #d1fae5;
  color: #065f46;
}

.connection-status.error {
  background: #fee2e2;
  color: #991b1b;
}

.data-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
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
  font-size: 20px;
  font-weight: 600;
}

.about-info {
  line-height: 1.8;
}

.about-desc {
  margin-top: 12px;
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
  width: 400px;
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
