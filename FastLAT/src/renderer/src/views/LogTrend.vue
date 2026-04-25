<template>
  <div class="log-trend">
    <h2 class="page-title">Log Trend Analysis</h2>

    <!-- Module Selection -->
    <div class="card">
      <div class="card-header">Select Modules to Analyze</div>
      <div class="module-selection">
        <div class="module-checkboxes">
          <label v-for="module in modules" :key="module" class="checkbox-label">
            <input type="checkbox" v-model="selectedModules" :value="module" />
            {{ module }}
          </label>
        </div>
        <button class="btn btn-primary" @click="loadTrendData" :disabled="selectedModules.length === 0">
          Load Trend Data
        </button>
      </div>
    </div>

    <!-- Time Range -->
    <div class="card">
      <div class="card-header">Time Range</div>
      <div class="time-range">
        <div class="form-group">
          <label class="form-label">From</label>
          <input v-model="timeRange.from" type="date" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">To</label>
          <input v-model="timeRange.to" type="date" class="form-input" />
        </div>
        <div class="quick-ranges">
          <button class="btn btn-secondary" @click="setQuickRange('today')">Today</button>
          <button class="btn btn-secondary" @click="setQuickRange('7d')">Last 7 Days</button>
          <button class="btn btn-secondary" @click="setQuickRange('30d')">Last 30 Days</button>
        </div>
      </div>
    </div>

    <!-- Trend Chart -->
    <div class="card">
      <div class="card-header">Log Volume Trend</div>
      <div v-if="chartData.labels.length > 0" class="chart-container">
        <canvas ref="chartCanvas"></canvas>
      </div>
      <p v-else class="empty-message">
        Select modules and click "Load Trend Data" to view the trend chart.
      </p>
    </div>

    <!-- Statistics -->
    <div v-if="statistics.length > 0" class="card">
      <div class="card-header">Statistics by Module</div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Module</th>
            <th>Total Normal</th>
            <th>Total Error</th>
            <th>Error Rate</th>
            <th>Peak Hour</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="stat in statistics" :key="stat.module">
            <td>{{ stat.module }}</td>
            <td><span class="badge badge-success">{{ stat.normalCount }}</span></td>
            <td><span class="badge badge-error">{{ stat.errorCount }}</span></td>
            <td>
              <span :class="['badge', stat.errorRate > 10 ? 'badge-error' : stat.errorRate > 5 ? 'badge-warning' : 'badge-success']">
                {{ stat.errorRate.toFixed(2) }}%
              </span>
            </td>
            <td>{{ stat.peakHour }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Hourly Distribution -->
    <div v-if="hourlyData.length > 0" class="card">
      <div class="card-header">Hourly Distribution</div>
      <div class="chart-container">
        <canvas ref="hourlyChartCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

interface ModuleStatistic {
  module: string
  normalCount: number
  errorCount: number
  errorRate: number
  peakHour: string
}

interface TrendDataPoint {
  date: string
  [module: string]: number | string
}

const modules = ref<string[]>([])
const selectedModules = ref<string[]>([])
const statistics = ref<ModuleStatistic[]>([])
const chartData = ref<{ labels: string[]; datasets: any[] }>({ labels: [], datasets: [] })
const hourlyData = ref<number[]>([])

const timeRange = ref({
  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0]
})

const chartCanvas = ref<HTMLCanvasElement | null>(null)
const hourlyChartCanvas = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  modules.value = await window.api.knowledgeBase.getModules()

  // Set default time range
  const today = new Date()
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  timeRange.value.to = today.toISOString().split('T')[0]
  timeRange.value.from = weekAgo.toISOString().split('T')[0]
})

function setQuickRange(range: string) {
  const today = new Date()
  let from = new Date()

  switch (range) {
    case 'today':
      from = today
      break
    case '7d':
      from = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      from = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
  }

  timeRange.value.to = today.toISOString().split('T')[0]
  timeRange.value.from = from.toISOString().split('T')[0]
}

async function loadTrendData() {
  if (selectedModules.value.length === 0) return

  // Load entries for each module
  const allEntries: { module: string; entries: any[] }[] = []

  for (const module of selectedModules.value) {
    const normalEntries = await window.api.knowledgeBase.getEntries(module, 'Normal', { limit: 10000 })
    const errorEntries = await window.api.knowledgeBase.getEntries(module, 'Error', { limit: 10000 })
    allEntries.push({ module, entries: [...normalEntries, ...errorEntries] })
  }

  // Calculate statistics
  calculateStatistics(allEntries)

  // Generate chart data
  generateChartData(allEntries)

  // Generate hourly distribution
  generateHourlyData(allEntries)

  // Draw charts
  await nextTick()
  drawCharts()
}

function calculateStatistics(data: { module: string; entries: any[] }[]) {
  statistics.value = data.map(({ module, entries }) => {
    const normalCount = entries.filter(e => e.metadata?.type === 'Normal').length
    const errorCount = entries.filter(e => e.metadata?.type === 'Error').length
    const total = normalCount + errorCount
    const errorRate = total > 0 ? (errorCount / total) * 100 : 0

    // Calculate peak hour
    const hourCounts: Record<number, number> = {}
    for (const entry of entries) {
      try {
        const hour = new Date(entry.timestamp).getHours()
        hourCounts[hour] = (hourCounts[hour] || 0) + 1
      } catch {}
    }
    let peakHour = 'N/A'
    let maxCount = 0
    for (const [hour, count] of Object.entries(hourCounts)) {
      if (count > maxCount) {
        maxCount = count
        peakHour = `${hour}:00`
      }
    }

    return { module, normalCount, errorCount, errorRate, peakHour }
  })
}

function generateChartData(data: { module: string; entries: any[] }[]) {
  // Group entries by date
  const dateMap: Record<string, Record<string, { normal: number; error: number }>> = {}

  for (const { module, entries } of data) {
    for (const entry of entries) {
      try {
        const date = new Date(entry.timestamp).toISOString().split('T')[0]
        if (!dateMap[date]) {
          dateMap[date] = {}
        }
        if (!dateMap[date][module]) {
          dateMap[date][module] = { normal: 0, error: 0 }
        }

        const isError = entry.metadata?.type === 'Error' || entry.level === 'ERROR'
        if (isError) {
          dateMap[date][module].error++
        } else {
          dateMap[date][module].normal++
        }
      } catch {}
    }
  }

  // Sort dates
  const dates = Object.keys(dateMap).sort()

  // Create datasets
  const datasets: any[] = []
  const colors = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6']

  selectedModules.value.forEach((module, index) => {
    const normalData = dates.map(date => dateMap[date]?.[module]?.normal || 0)
    const errorData = dates.map(date => dateMap[date]?.[module]?.error || 0)

    datasets.push({
      label: `${module} - Normal`,
      data: normalData,
      borderColor: colors[index % colors.length],
      backgroundColor: colors[index % colors.length] + '20',
      tension: 0.3
    })

    datasets.push({
      label: `${module} - Error`,
      data: errorData,
      borderColor: '#dc2626',
      backgroundColor: '#dc262620',
      borderDash: [5, 5],
      tension: 0.3
    })
  })

  chartData.value = { labels: dates, datasets }
}

function generateHourlyData(data: { module: string; entries: any[] }[]) {
  const hourCounts = new Array(24).fill(0)

  for (const { entries } of data) {
    for (const entry of entries) {
      try {
        const hour = new Date(entry.timestamp).getHours()
        hourCounts[hour]++
      } catch {}
    }
  }

  hourlyData.value = hourCounts
}

function drawCharts() {
  if (!chartCanvas.value || !hourlyChartCanvas.value) return

  // Simple bar chart drawing using canvas
  const ctx = chartCanvas.value.getContext('2d')
  if (ctx && chartData.value.labels.length > 0) {
    drawLineChart(ctx, chartData.value)
  }

  const hourlyCtx = hourlyChartCanvas.value.getContext('2d')
  if (hourlyCtx && hourlyData.value.length > 0) {
    drawBarChart(hourlyCtx, hourlyData.value)
  }
}

function drawLineChart(ctx: CanvasRenderingContext2D, data: { labels: string[]; datasets: any[] }) {
  const canvas = ctx.canvas
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = canvas.width - padding.left - padding.right
  const chartHeight = canvas.height - padding.top - padding.bottom

  // Find max value
  let maxValue = 0
  for (const dataset of data.datasets) {
    for (const value of dataset.data as number[]) {
      if (value > maxValue) maxValue = value
    }
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw grid
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i
    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(padding.left + chartWidth, y)
    ctx.stroke()

    // Y-axis labels
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'right'
    const value = Math.round(maxValue * (1 - i / 5))
    ctx.fillText(value.toString(), padding.left - 5, y + 4)
  }

  // Draw X-axis labels
  ctx.textAlign = 'center'
  const step = Math.ceil(data.labels.length / 10)
  data.labels.forEach((label, index) => {
    if (index % step === 0) {
      const x = padding.left + (chartWidth / (data.labels.length - 1)) * index
      ctx.fillText(label.substring(5), x, canvas.height - 10)
    }
  })

  // Draw lines
  data.datasets.forEach((dataset, datasetIndex) => {
    ctx.strokeStyle = dataset.borderColor
    ctx.lineWidth = 2
    ctx.setLineDash(dataset.borderDash || [])
    ctx.beginPath()

    ;(dataset.data as number[]).forEach((value, index) => {
      const x = padding.left + (chartWidth / (data.labels.length - 1)) * index
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw points
    ctx.fillStyle = dataset.borderColor
    ;(dataset.data as number[]).forEach((value, index) => {
      const x = padding.left + (chartWidth / (data.labels.length - 1)) * index
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  })

  // Draw legend
  ctx.setLineDash([])
  let legendX = padding.left
  data.datasets.forEach((dataset, index) => {
    ctx.fillStyle = dataset.borderColor
    ctx.fillRect(legendX, 5, 12, 12)
    ctx.fillStyle = '#374151'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(dataset.label, legendX + 16, 15)
    legendX += ctx.measureText(dataset.label).width + 40
  })
}

function drawBarChart(ctx: CanvasRenderingContext2D, data: number[]) {
  const canvas = ctx.canvas
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = canvas.width - padding.left - padding.right
  const chartHeight = canvas.height - padding.top - padding.bottom

  const maxValue = Math.max(...data, 1)
  const barWidth = chartWidth / 24 - 4

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Draw bars
  data.forEach((value, hour) => {
    const x = padding.left + (chartWidth / 24) * hour + 2
    const barHeight = (value / maxValue) * chartHeight
    const y = padding.top + chartHeight - barHeight

    ctx.fillStyle = hour >= 9 && hour <= 18 ? '#2563eb' : '#93c5fd'
    ctx.fillRect(x, y, barWidth, barHeight)

    // Value label
    if (value > 0) {
      ctx.fillStyle = '#374151'
      ctx.font = '10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(value.toString(), x + barWidth / 2, y - 4)
    }
  })

  // X-axis labels
  ctx.fillStyle = '#6b7280'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  for (let hour = 0; hour < 24; hour += 6) {
    const x = padding.left + (chartWidth / 24) * hour + barWidth / 2
    ctx.fillText(`${hour}:00`, x, canvas.height - 10)
  }
}
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
}

.module-selection {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.module-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.time-range {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.time-range .form-group {
  min-width: 150px;
}

.quick-ranges {
  display: flex;
  gap: 8px;
}

.chart-container {
  width: 100%;
  height: 300px;
  margin-top: 16px;
}

canvas {
  width: 100%;
  height: 100%;
}

.empty-message {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
</style>
