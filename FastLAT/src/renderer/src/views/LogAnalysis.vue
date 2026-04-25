<template>
  <div class="log-analysis">
    <h2 class="page-title">Log Analysis</h2>

    <!-- Analysis Input -->
    <div class="card">
      <div class="card-header">Ask Questions About Your Logs</div>
      <div class="analysis-form">
        <div class="form-group">
          <label class="form-label">Analysis Question</label>
          <textarea
            v-model="question"
            class="form-input"
            rows="3"
            placeholder="e.g., What are the main errors in the DiamAdapter module? What caused the connection timeouts?"
          ></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Filter by Modules (optional)</label>
          <div class="module-checkboxes">
            <label v-for="module in modules" :key="module" class="checkbox-label">
              <input type="checkbox" v-model="selectedModules" :value="module" />
              {{ module }}
            </label>
          </div>
        </div>
        <button
          class="btn btn-primary"
          @click="startAnalysis"
          :disabled="isAnalyzing || !question.trim()"
        >
          {{ isAnalyzing ? 'Analyzing...' : 'Start Analysis' }}
        </button>
      </div>
    </div>

    <!-- Analysis Status -->
    <div v-if="isAnalyzing" class="card">
      <div class="analysis-status">
        <div class="status-indicator">
          <span class="spinner"></span>
          <span>{{ statusMessage }}</span>
        </div>
      </div>
    </div>

    <!-- Analysis Results -->
    <div v-if="currentResult" class="analysis-results">
      <div class="card">
        <div class="card-header">
          Analysis Result
          <button class="btn btn-primary" style="float: right;" @click="generateReport">
            Generate Report
          </button>
        </div>

        <!-- Summary -->
        <div class="result-section">
          <h3>Summary</h3>
          <div class="summary-box">{{ currentResult.summary }}</div>
        </div>

        <!-- Key Issues -->
        <div v-if="currentResult.keyIssues.length > 0" class="result-section">
          <h3>Key Issues ({{ currentResult.keyIssues.length }})</h3>
          <ul class="issues-list">
            <li v-for="(issue, index) in currentResult.keyIssues" :key="index" class="issue-item">
              {{ issue }}
            </li>
          </ul>
        </div>

        <!-- Error Details -->
        <div v-if="currentResult.errorDetails.length > 0" class="result-section">
          <h3>Error Details</h3>
          <div v-for="(error, index) in currentResult.errorDetails" :key="index" class="error-detail">
            <div class="error-header">
              <span v-if="error.errorCode" class="error-code">{{ error.errorCode }}</span>
              <span class="timestamp">{{ error.timestamp }}</span>
            </div>
            <p>{{ error.description }}</p>
            <p v-if="error.suggestedAction" class="suggested-action">
              <strong>Suggested Action:</strong> {{ error.suggestedAction }}
            </p>
          </div>
        </div>

        <!-- Recommendations -->
        <div v-if="currentResult.recommendations.length > 0" class="result-section">
          <h3>Recommendations</h3>
          <ul class="recommendations-list">
            <li v-for="(rec, index) in currentResult.recommendations" :key="index" class="recommendation-item">
              {{ rec }}
            </li>
          </ul>
        </div>

        <!-- Related Modules -->
        <div v-if="currentResult.relatedModules?.length > 0" class="result-section">
          <h3>Related Modules</h3>
          <div class="related-modules">
            <span v-for="module in currentResult.relatedModules" :key="module" class="badge badge-info">
              {{ module }}
            </span>
          </div>
        </div>

        <!-- Metadata -->
        <div class="result-metadata">
          <span>Context entries used: {{ currentResult.contextCount }}</span>
          <span>Processing time: {{ currentResult.processingTime }}ms</span>
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="card">
      <div class="card-header">Analysis History</div>
      <div v-if="history.length > 0" class="history-list">
        <div
          v-for="(item, index) in history"
          :key="index"
          class="history-item"
          @click="loadHistoryItem(item)"
        >
          <div class="history-summary">{{ item.summary.substring(0, 100) }}...</div>
          <div class="history-meta">
            <span>{{ item.contextCount }} entries</span>
            <span>{{ item.processingTime }}ms</span>
          </div>
        </div>
      </div>
      <p v-else class="empty-message">No analysis history yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface AnalysisResult {
  success: boolean
  summary: string
  keyIssues: string[]
  errorDetails: Array<{
    timestamp: string
    errorCode?: string
    description: string
    suggestedAction?: string
  }>
  recommendations: string[]
  relatedModules?: string[]
  contextCount: number
  processingTime: number
}

const question = ref('')
const modules = ref<string[]>([])
const selectedModules = ref<string[]>([])
const isAnalyzing = ref(false)
const statusMessage = ref('')
const currentResult = ref<AnalysisResult | null>(null)
const history = ref<AnalysisResult[]>([])

onMounted(async () => {
  modules.value = await window.api.knowledgeBase.getModules()
  history.value = await window.api.analysis.getHistory()
})

async function startAnalysis() {
  if (!question.value.trim()) return

  isAnalyzing.value = true
  statusMessage.value = 'Retrieving relevant context from knowledge base...'
  currentResult.value = null

  try {
    const result = await window.api.analysis.analyze(
      question.value,
      selectedModules.value.length > 0 ? selectedModules.value : undefined
    )
    currentResult.value = result
    history.value = await window.api.analysis.getHistory()
  } catch (error) {
    console.error('Analysis failed:', error)
  } finally {
    isAnalyzing.value = false
    statusMessage.value = ''
  }
}

function loadHistoryItem(item: AnalysisResult) {
  currentResult.value = item
}

async function generateReport() {
  if (!currentResult.value) return

  try {
    const report = await window.api.report.generate(currentResult.value, {
      title: question.value.substring(0, 50)
    })
    alert(`Report generated: ${report.id}`)
  } catch (error) {
    console.error('Report generation failed:', error)
  }
}
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.analysis-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

textarea.form-input {
  resize: vertical;
  min-height: 80px;
}

.module-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.analysis-status {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.result-section {
  margin-bottom: 24px;
}

.result-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #374151;
}

.summary-box {
  background: #f3f4f6;
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
}

.issues-list {
  list-style: none;
}

.issue-item {
  background: white;
  border-left: 4px solid #ef4444;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 0 4px 4px 0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.error-detail {
  background: #fef2f2;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.error-code {
  background: #fee2e2;
  color: #991b1b;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.timestamp {
  color: #6b7280;
  font-size: 13px;
}

.suggested-action {
  margin-top: 8px;
  color: #2563eb;
  font-size: 14px;
}

.recommendations-list {
  list-style: none;
}

.recommendation-item {
  background: #eff6ff;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  border-left: 4px solid #2563eb;
}

.related-modules {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.result-metadata {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  color: #6b7280;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: #f9fafb;
  border-color: #2563eb;
}

.history-summary {
  font-size: 14px;
  margin-bottom: 8px;
}

.history-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6b7280;
}

.empty-message {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
</style>
