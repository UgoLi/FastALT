<template>
  <div class="log-import">
    <h2 class="page-title">{{ t('logImport.title') }}</h2>

    <!-- File Selection -->
    <div class="card">
      <div class="card-header">{{ t('logImport.selectFiles') }}</div>
      <div class="file-drop-zone" @click="selectFiles">
        <div class="drop-content">
          <span class="drop-icon">📁</span>
          <p>{{ t('logImport.selectFiles') }}</p>
          <p class="drop-hint">{{ t('logImport.dropHint') }}</p>
        </div>
      </div>

      <!-- Selected Files -->
      <div v-if="selectedFiles.length > 0" class="selected-files">
        <h4>{{ t('logImport.selectedFiles') }} ({{ selectedFiles.length }})</h4>
        <table class="data-table">
          <thead>
            <tr>
              <th>{{ t('logImport.fileName') }}</th>
              <th>{{ t('logImport.size') }}</th>
              <th>{{ t('logImport.detectedModule') }}</th>
              <th>{{ t('logImport.logNamePrefix') }}</th>
              <th>{{ t('logImport.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in selectedFiles" :key="file.id">
              <td>{{ file.name }}</td>
              <td>{{ formatSize(file.size) }}</td>
              <td>
                <select v-model="file.moduleName" class="form-input" style="width: auto;">
                  <option v-for="mod in moduleNames" :key="mod" :value="mod">
                    {{ mod }}
                  </option>
                </select>
              </td>
              <td>
                <input
                  v-model="file.logNamePrefix"
                  class="form-input"
                  style="width: 100px;"
                  :placeholder="t('logImport.logNamePrefix')"
                />
              </td>
              <td>
                <button class="btn btn-danger" @click="removeFile(file.id)">{{ t('logImport.remove') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cleaning Rules by Module -->
    <div class="card">
      <div class="card-header">
        {{ t('logImport.cleaningRules') }}
        <div class="header-actions">
          <button class="btn btn-secondary" @click="showModuleEditor = true">{{ t('logImport.addModule') || 'Add Module' }}</button>
          <button class="btn btn-secondary" @click="importRules">{{ t('logImport.importRules') }}</button>
          <button class="btn btn-secondary" @click="exportRules">{{ t('logImport.exportRules') }}</button>
          <button class="btn btn-primary" @click="showRuleEditor = true">{{ t('logImport.addRule') }}</button>
        </div>
      </div>

      <!-- Module accordion -->
      <div v-for="moduleConfig in moduleConfigs" :key="moduleConfig.moduleName" class="module-section">
        <div class="module-header" @click="toggleModule(moduleConfig.moduleName)">
          <span class="module-name">{{ moduleConfig.moduleName }}</span>
          <span class="rule-count">({{ moduleConfig.rules.length }} {{ t('logImport.rules') || 'rules' }})</span>
          <span class="expand-icon">{{ expandedModules[moduleConfig.moduleName] ? '▼' : '▶' }}</span>
        </div>

        <div v-if="expandedModules[moduleConfig.moduleName]" class="module-rules">
          <table class="data-table" v-if="moduleConfig.rules.length > 0">
            <thead>
              <tr>
                <th>{{ t('logImport.logNamePrefix') }}</th>
                <th>{{ t('logImport.pattern') }}</th>
                <th>{{ t('logImport.status') }}</th>
                <th>{{ t('logImport.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="rule in moduleConfig.rules" :key="rule.id">
                <td><code>{{ rule.logNamePrefix || '-' }}</code></td>
                <td><code>{{ rule.pattern.substring(0, 40) }}...</code></td>
                <td>
                  <span :class="['badge', rule.enabled ? 'badge-success' : 'badge-warning']">
                    {{ rule.enabled ? t('common.enabled') : t('common.disabled') }}
                  </span>
                </td>
                <td>
                  <button class="btn btn-secondary" @click="editRule(rule)">
                    {{ t('common.edit') }}
                  </button>
                  <button class="btn btn-secondary" @click="toggleRule(rule)">
                    {{ rule.enabled ? t('logImport.disableRule') : t('logImport.enableRule') }}
                  </button>
                  <button class="btn btn-danger" @click="deleteRule(rule.id)">
                    {{ t('common.delete') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="empty-message">{{ t('common.noData') }}</p>
        </div>
      </div>

      <p v-if="moduleConfigs.length === 0" class="empty-message">{{ t('common.noData') }}</p>
    </div>

    <!-- Clean Button -->
    <div class="actions" v-if="selectedFiles.length > 0">
      <button class="btn btn-primary btn-large" @click="startCleaning" :disabled="isCleaning">
        {{ isCleaning ? t('common.loading') : t('logImport.startCleaning') }}
      </button>
    </div>

    <!-- Cleaning Progress -->
    <div v-if="isCleaning" class="card">
      <div class="card-header">{{ t('logImport.cleaningProgress') }}</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <p class="progress-text">{{ progress }}% - {{ cleanedCount }} {{ t('logImport.entriesProcessed') }}</p>
    </div>

    <!-- Cleaning Results -->
    <div v-if="cleaningResults.length > 0" class="card">
      <div class="card-header">{{ t('logImport.cleaningResults') }}</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('logImport.module') }}</th>
            <th>{{ t('logImport.totalLines') }}</th>
            <th>{{ t('logImport.normal') }}</th>
            <th>{{ t('logImport.error') }}</th>
            <th>{{ t('logImport.status') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="result in cleaningResults" :key="result.moduleName">
            <td>{{ result.moduleName }}</td>
            <td>{{ result.totalLines }}</td>
            <td><span class="badge badge-success">{{ result.normalCount }}</span></td>
            <td><span class="badge badge-error">{{ result.errorCount }}</span></td>
            <td>
              <span :class="['badge', result.success ? 'badge-success' : 'badge-error']">
                {{ result.success ? t('common.success') : t('common.failed') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Module Editor Modal -->
    <div v-if="showModuleEditor" class="modal-overlay" @click.self="showModuleEditor = false">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingModule ? t('logImport.editModule') || 'Edit Module' : t('logImport.addModule') || 'Add Module' }}</h3>
          <button class="close-btn" @click="showModuleEditor = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ t('logImport.moduleName') }}</label>
            <input v-model="moduleForm.moduleName" class="form-input" :placeholder="t('logImport.moduleName')" :disabled="!!editingModule" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showModuleEditor = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="saveModule">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>

    <!-- Rule Editor Modal -->
    <div v-if="showRuleEditor" class="modal-overlay" @click.self="closeRuleEditor">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingRule ? t('logImport.editRule') : t('logImport.addRule') }}</h3>
          <button class="close-btn" @click="closeRuleEditor">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">{{ t('logImport.moduleName') }}</label>
            <select v-model="ruleForm.moduleName" class="form-input" :disabled="!!editingRule">
              <option v-for="mod in moduleNames" :key="mod" :value="mod">
                {{ mod }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('logImport.logNamePrefix') }}</label>
            <input v-model="ruleForm.logNamePrefix" class="form-input" :placeholder="t('logImport.logNamePrefixPlaceholder')" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('logImport.pattern') }}</label>
            <input v-model="ruleForm.pattern" class="form-input" placeholder="e.g., \[(\d{4}-\d{2}-\d{2})\] \[(\w+)\] (.+)" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ t('logImport.timestampGroup') }}</label>
              <input v-model.number="ruleForm.timestampGroup" type="number" class="form-input" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('logImport.levelGroup') }}</label>
              <input v-model.number="ruleForm.levelGroup" type="number" class="form-input" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('logImport.contentGroup') }}</label>
              <input v-model.number="ruleForm.contentGroup" type="number" class="form-input" min="1" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" v-model="ruleForm.enabled" /> {{ t('logImport.enableRule') }}
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeRuleEditor">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="saveRule">{{ t('common.save') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from '../i18n'

const { t } = useI18n()

interface ImportedFile {
  id: string
  name: string
  path: string
  size: number
  importedAt: string
  moduleName: string
  logNamePrefix?: string
}

interface CleaningRule {
  id: string
  moduleName: string
  logNamePrefix: string
  pattern: string
  timestampGroup: number
  levelGroup: number
  contentGroup: number
  multiline: boolean
  enabled: boolean
}

interface ModuleConfig {
  moduleName: string
  rules: CleaningRule[]
}

interface CleaningResult {
  success: boolean
  moduleName: string
  totalLines: number
  normalCount: number
  errorCount: number
  cleanedEntries: any[]
}

const selectedFiles = ref<ImportedFile[]>([])
const moduleConfigs = ref<ModuleConfig[]>([])
const moduleNames = ref<string[]>([])
const isCleaning = ref(false)
const progress = ref(0)
const cleanedCount = ref(0)
const cleaningResults = ref<CleaningResult[]>([])
const showRuleEditor = ref(false)
const showModuleEditor = ref(false)
const editingRule = ref<CleaningRule | null>(null)
const editingModule = ref<string | null>(null)
const expandedModules = reactive<Record<string, boolean>>({})

const ruleForm = ref({
  moduleName: '',
  logNamePrefix: '',
  pattern: '',
  timestampGroup: 1,
  levelGroup: 2,
  contentGroup: 3,
  multiline: false,
  enabled: true
})

const moduleForm = ref({
  moduleName: ''
})

onMounted(async () => {
  await loadModuleConfigs()
})

async function loadModuleConfigs() {
  moduleConfigs.value = await window.api.logCleaning.getModuleConfigs()
  moduleNames.value = await window.api.logCleaning.getModuleNames()
  // Expand all modules by default
  for (const mod of moduleNames.value) {
    expandedModules[mod] = true
  }
}

async function selectFiles() {
  const paths = await window.api.util.selectFiles()
  if (paths.length > 0) {
    const newFiles = await window.api.logCleaning.importFiles(paths)
    for (const file of newFiles) {
      // Find matching rule to set logNamePrefix
      const modConfig = moduleConfigs.value.find(m => m.moduleName === file.moduleName)
      if (modConfig && modConfig.rules.length > 0) {
        file.logNamePrefix = modConfig.rules[0].logNamePrefix
      }
    }
    selectedFiles.value.push(...newFiles)
  }
}

function removeFile(id: string) {
  selectedFiles.value = selectedFiles.value.filter(f => f.id !== id)
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function toggleModule(moduleName: string) {
  expandedModules[moduleName] = !expandedModules[moduleName]
}

async function startCleaning() {
  isCleaning.value = true
  progress.value = 0
  cleanedCount.value = 0
  cleaningResults.value = []

  const files = selectedFiles.value.map(f => ({
    path: f.path,
    moduleName: f.moduleName
  }))

  try {
    const entries = await window.api.logCleaning.cleanLogs(files)
    const moduleResults = new Map<string, CleaningResult>()

    for (const entry of entries) {
      const result = moduleResults.get(entry.sourceFile) || {
        success: true,
        moduleName: selectedFiles.value.find(f => f.path.includes(entry.sourceFile))?.moduleName || 'Unknown',
        totalLines: 0,
        normalCount: 0,
        errorCount: 0,
        cleanedEntries: []
      }
      result.totalLines++
      result.cleanedEntries.push(entry)
      if (entry.level === 'ERROR' || entry.level === 'WARN' || entry.errorCode) {
        result.errorCount++
      } else {
        result.normalCount++
      }
      moduleResults.set(entry.sourceFile, result)
    }

    cleaningResults.value = Array.from(moduleResults.values())
    progress.value = 100
    cleanedCount.value = entries.length
  } catch (error) {
    console.error('Cleaning failed:', error)
  } finally {
    isCleaning.value = false
  }
}

function editRule(rule: CleaningRule) {
  editingRule.value = rule
  ruleForm.value = {
    moduleName: rule.moduleName,
    logNamePrefix: rule.logNamePrefix,
    pattern: rule.pattern,
    timestampGroup: rule.timestampGroup,
    levelGroup: rule.levelGroup,
    contentGroup: rule.contentGroup,
    multiline: rule.multiline,
    enabled: rule.enabled
  }
  showRuleEditor.value = true
}

function closeRuleEditor() {
  showRuleEditor.value = false
  editingRule.value = null
  ruleForm.value = {
    moduleName: moduleNames.value[0] || '',
    logNamePrefix: '',
    pattern: '',
    timestampGroup: 1,
    levelGroup: 2,
    contentGroup: 3,
    multiline: false,
    enabled: true
  }
}

async function saveRule() {
  const rule: CleaningRule = {
    id: editingRule.value?.id || `rule-${Date.now()}`,
    moduleName: ruleForm.value.moduleName,
    logNamePrefix: ruleForm.value.logNamePrefix,
    pattern: ruleForm.value.pattern,
    timestampGroup: ruleForm.value.timestampGroup,
    levelGroup: ruleForm.value.levelGroup,
    contentGroup: ruleForm.value.contentGroup,
    multiline: ruleForm.value.multiline,
    enabled: ruleForm.value.enabled
  }

  await window.api.logCleaning.saveRule(rule)
  await loadModuleConfigs()
  closeRuleEditor()
}

async function toggleRule(rule: CleaningRule) {
  rule.enabled = !rule.enabled
  await window.api.logCleaning.saveRule(rule)
  await loadModuleConfigs()
}

async function deleteRule(ruleId: string) {
  await window.api.logCleaning.deleteRule(ruleId)
  await loadModuleConfigs()
}

async function saveModule() {
  if (!moduleForm.value.moduleName.trim()) return

  const moduleName = moduleForm.value.moduleName.trim()

  // Add a default rule for the new module
  const defaultRule: CleaningRule = {
    id: `rule-${Date.now()}`,
    moduleName: moduleName,
    logNamePrefix: '',
    pattern: '\\[(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\] \\[(\\w+)\\] (.+)',
    timestampGroup: 1,
    levelGroup: 2,
    contentGroup: 3,
    multiline: false,
    enabled: true
  }

  try {
    await window.api.logCleaning.saveRule(defaultRule)
    await loadModuleConfigs()
    showModuleEditor.value = false
    moduleForm.value.moduleName = ''
  } catch (error) {
    console.error('Failed to save module:', error)
    alert('Failed to save module: ' + String(error))
  }
}

async function exportRules() {
  const json = await window.api.logCleaning.exportRules()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'cleaning-rules.json'
  a.click()
  URL.revokeObjectURL(url)
  alert(t('logImport.rulesExported'))
}

async function importRules() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const text = await file.text()
      const result = await window.api.logCleaning.importRules(text)
      if (result.errors) {
        alert(`Import failed: ${result.errors}`)
      } else {
        alert(`${result.imported} ${t('logImport.rulesImported')}`)
      }
      await loadModuleConfigs()
    }
  }
  input.click()
}
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.file-drop-zone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.file-drop-zone:hover {
  border-color: #2563eb;
  background: #f0f9ff;
}

.drop-content {
  pointer-events: none;
}

.drop-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.drop-hint {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}

.selected-files {
  margin-top: 20px;
}

.selected-files h4 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  gap: 8px;
  float: right;
}

.module-section {
  margin-bottom: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.module-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  cursor: pointer;
  user-select: none;
}

.module-header:hover {
  background: #f3f4f6;
}

.module-name {
  font-weight: 600;
  color: #374151;
}

.rule-count {
  font-size: 13px;
  color: #6b7280;
}

.expand-icon {
  margin-left: auto;
  color: #6b7280;
}

.module-rules {
  padding: 16px;
  background: white;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row .form-group {
  flex: 1;
}

.actions {
  margin-top: 20px;
}

.btn-large {
  padding: 14px 32px;
  font-size: 16px;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  transition: width 0.3s;
}

.progress-text {
  margin-top: 8px;
  font-size: 14px;
  color: #6b7280;
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
