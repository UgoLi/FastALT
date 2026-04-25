import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { LogCleaningService } from './services/LogCleaningService'
import { KnowledgeBaseService } from './services/KnowledgeBaseService'
import { LLMService } from './services/LLMService'
import { RAGService } from './services/RAGService'
import { ReportService } from './services/ReportService'
import * as fs from 'fs'

// Services
const logCleaningService = new LogCleaningService()
const knowledgeBaseService = new KnowledgeBaseService()
const llmService = new LLMService()
const ragService = new RAGService(llmService, knowledgeBaseService)
const reportService = new ReportService()

// Data paths
const dataPath = join(app.getPath('userData'), 'data')
const configPath = join(dataPath, 'config')
const kbPath = join(dataPath, 'knowledge-base')
const reportsPath = join(dataPath, 'reports')
const casesPath = join(dataPath, 'cases')

function ensureDataDirs(): void {
  const dirs = [dataPath, configPath, kbPath, reportsPath, casesPath]
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1400,
    minHeight: 900,
    show: false,
    autoHideMenuBar: true,
    title: 'FastLAT - Fast Log Analysis Tool v1.0.0',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Initialize services
async function initializeServices(): Promise<void> {
  ensureDataDirs()
  await knowledgeBaseService.initialize(kbPath)
  await logCleaningService.loadRules(join(configPath, 'cleaningRules.json'))
}

// IPC Handlers
function setupIpcHandlers(): void {
  // Log Cleaning
  ipcMain.handle('logCleaning:importFiles', async (_, filePaths: string[]) => {
    return logCleaningService.importFiles(filePaths)
  })

  ipcMain.handle('logCleaning:detectModule', async (_, filePath: string) => {
    return logCleaningService.detectModule(filePath)
  })

  ipcMain.handle('logCleaning:cleanLogs', async (_, files: Array<{ path: string; moduleName: string }>) => {
    return logCleaningService.batchClean(files, knowledgeBaseService)
  })

  ipcMain.handle('logCleaning:getModuleConfigs', async () => {
    return logCleaningService.getModuleConfigs()
  })

  ipcMain.handle('logCleaning:getRules', async () => {
    return logCleaningService.getAllRules()
  })

  ipcMain.handle('logCleaning:saveRule', async (_, rule) => {
    try {
      await logCleaningService.saveRule(rule, join(configPath, 'cleaningRules.json'))
      return { success: true }
    } catch (error) {
      console.error('Failed to save rule:', error)
      throw error
    }
  })

  ipcMain.handle('logCleaning:deleteRule', async (_, ruleId: string) => {
    try {
      await logCleaningService.deleteRule(ruleId, join(configPath, 'cleaningRules.json'))
      return { success: true }
    } catch (error) {
      console.error('Failed to delete rule:', error)
      throw error
    }
  })

  ipcMain.handle('logCleaning:exportRules', async () => {
    return logCleaningService.exportRules()
  })

  ipcMain.handle('logCleaning:importRules', async (_, jsonContent: string) => {
    return logCleaningService.importRules(jsonContent, join(configPath, 'cleaningRules.json'))
  })

  ipcMain.handle('logCleaning:getModuleNames', async () => {
    return logCleaningService.getModuleNames()
  })

  // Knowledge Base
  ipcMain.handle('kb:getModules', async () => {
    return knowledgeBaseService.getModules()
  })

  ipcMain.handle('kb:getEntries', async (_, moduleName: string, type: 'Normal' | 'Error', options?: { offset?: number; limit?: number }) => {
    return knowledgeBaseService.getEntries(moduleName, type, options)
  })

  ipcMain.handle('kb:searchEntries', async (_, query: string, moduleNames?: string[]) => {
    return knowledgeBaseService.textSearch(query, moduleNames)
  })

  ipcMain.handle('kb:addEntries', async (_, moduleName: string, type: 'Normal' | 'Error', entries) => {
    return knowledgeBaseService.addEntries(moduleName, type, entries)
  })

  ipcMain.handle('kb:deleteEntries', async (_, moduleName: string, type: 'Normal' | 'Error', entryIds: string[]) => {
    return knowledgeBaseService.deleteEntries(moduleName, type, entryIds)
  })

  ipcMain.handle('kb:exportKB', async (_, moduleName: string, type: 'Normal' | 'Error') => {
    return knowledgeBaseService.exportKB(moduleName, type)
  })

  ipcMain.handle('kb:getStatistics', async (_, moduleName: string) => {
    return knowledgeBaseService.getStatistics(moduleName)
  })

  // Analysis
  ipcMain.handle('analysis:analyze', async (_, question: string, moduleNames?: string[]) => {
    return ragService.analyze(question, moduleNames)
  })

  ipcMain.handle('analysis:getHistory', async () => {
    return ragService.getHistory()
  })

  // LLM Settings
  ipcMain.handle('llm:getConfig', async () => {
    return llmService.getConfig()
  })

  ipcMain.handle('llm:saveConfig', async (_, config) => {
    await llmService.saveConfig(config, join(dataPath, 'llm-config.json'))
    return true
  })

  ipcMain.handle('llm:healthCheck', async () => {
    return llmService.healthCheck()
  })

  // Report
  ipcMain.handle('report:generate', async (_, analysisResult, options) => {
    return reportService.generateReport(analysisResult, options, reportsPath)
  })

  ipcMain.handle('report:getReports', async () => {
    return reportService.getReports(reportsPath)
  })

  ipcMain.handle('report:getReport', async (_, reportId: string) => {
    return reportService.getReport(reportId, reportsPath)
  })

  ipcMain.handle('report:importToCaseKB', async (_, reportId: string, caseName: string) => {
    const report = await reportService.getReport(reportId, reportsPath)
    if (!report) throw new Error('Report not found')
    return reportService.importToCaseKB(report, caseName, casesPath, knowledgeBaseService)
  })

  // Utility
  ipcMain.handle('util:selectFiles', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Log Files', extensions: ['log', 'txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    return result.filePaths
  })

  ipcMain.handle('util:selectDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.filePaths[0] || null
  })

  ipcMain.handle('util:showInFolder', async (_, path: string) => {
    shell.showItemInFolder(path)
  })

  ipcMain.handle('util:getAppVersion', async () => {
    return app.getVersion()
  })
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.fastlat.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  await initializeServices()
  setupIpcHandlers()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
