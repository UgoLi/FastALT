<template>
  <div class="report-view">
    <h2 class="page-title">Analysis Reports</h2>

    <!-- Reports List -->
    <div class="card">
      <div class="card-header">
        Saved Reports
        <button class="btn btn-secondary" @click="refreshReports">Refresh</button>
      </div>

      <div v-if="reports.length > 0" class="reports-grid">
        <div
          v-for="report in reports"
          :key="report.id"
          class="report-card"
          @click="viewReport(report)"
        >
          <div class="report-header">
            <h3 class="report-title">{{ report.title }}</h3>
            <span class="report-date">{{ formatDate(report.generatedAt) }}</span>
          </div>
          <div class="report-modules">
            <span v-for="module in report.moduleNames" :key="module" class="badge badge-info">
              {{ module }}
            </span>
          </div>
          <p class="report-summary">{{ report.analysisResult.summary.substring(0, 150) }}...</p>
          <div class="report-meta">
            <span>{{ report.analysisResult.contextCount }} entries</span>
            <span>{{ report.analysisResult.processingTime }}ms</span>
          </div>
        </div>
      </div>

      <p v-else class="empty-message">No reports generated yet.</p>
    </div>

    <!-- Report Viewer Modal -->
    <div v-if="selectedReport" class="modal-overlay" @click.self="selectedReport = null">
      <div class="modal modal-large">
        <div class="modal-header">
          <h3>{{ selectedReport.title }}</h3>
          <button class="close-btn" @click="selectedReport = null">&times;</button>
        </div>
        <div class="modal-body">
          <div class="report-content" v-html="selectedReport.htmlContent"></div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="exportReport">Export HTML</button>
          <button class="btn btn-secondary" @click="printReport">Print / Save as PDF</button>
          <button class="btn btn-primary" @click="importToCase">Import to Case KB</button>
        </div>
      </div>
    </div>

    <!-- Import to Case Modal -->
    <div v-if="showCaseImport" class="modal-overlay" @click.self="showCaseImport = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Import to Case Knowledge Base</h3>
          <button class="close-btn" @click="showCaseImport = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Case Name</label>
            <input
              v-model="caseName"
              class="form-input"
              placeholder="e.g., Incident-2024-001"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCaseImport = false">Cancel</button>
          <button class="btn btn-primary" @click="confirmImport">Import</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Report {
  id: string
  title: string
  generatedAt: string
  analysisResult: {
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
  moduleNames: string[]
  question: string
  htmlContent: string
}

const reports = ref<Report[]>([])
const selectedReport = ref<Report | null>(null)
const showCaseImport = ref(false)
const caseName = ref('')

onMounted(async () => {
  await refreshReports()
})

async function refreshReports() {
  reports.value = await window.api.report.getReports()
}

function formatDate(date: string): string {
  try {
    return new Date(date).toLocaleString()
  } catch {
    return date
  }
}

async function viewReport(report: Report) {
  const fullReport = await window.api.report.getReport(report.id)
  if (fullReport) {
    selectedReport.value = fullReport
  }
}

async function exportReport() {
  if (!selectedReport.value) return

  const blob = new Blob([selectedReport.value.htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report-${selectedReport.value.id}.html`
  a.click()
  URL.revokeObjectURL(url)
}

function printReport() {
  if (!selectedReport.value) return

  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(selectedReport.value.htmlContent)
    printWindow.document.close()
    printWindow.print()
  }
}

function importToCase() {
  showCaseImport.value = true
  caseName.value = `Case-${new Date().toISOString().split('T')[0]}`
}

async function confirmImport() {
  if (!selectedReport.value || !caseName.value.trim()) return

  try {
    await window.api.report.importToCaseKB(selectedReport.value.id, caseName.value)
    alert('Report imported to case knowledge base successfully!')
    showCaseImport.value = false
  } catch (error) {
    console.error('Import failed:', error)
    alert('Failed to import report')
  }
}
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.report-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.report-card:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.report-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.report-date {
  font-size: 12px;
  color: #6b7280;
}

.report-modules {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.report-summary {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 12px;
}

.report-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
}

.empty-message {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.modal-large {
  width: 900px;
  max-width: 90vw;
}

.modal-body {
  max-height: 70vh;
  overflow-y: auto;
}

.report-content {
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}
</style>
