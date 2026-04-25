import { contextBridge, ipcRenderer } from 'electron'

// Type definitions for exposed API
export interface CleaningRule {
  id: string
  moduleName: string
  pattern: string
  timestampGroup: number
  levelGroup: number
  contentGroup: number
  multiline: boolean
  enabled: boolean
}

export interface CleanedLogEntry {
  id: string
  timestamp: string
  rawContent: string
  cleanedContent: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'UNKNOWN'
  keywords: string[]
  errorCode?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  lineNumber: number
  sourceFile: string
}

export interface ImportedFile {
  id: string
  name: string
  path: string
  size: number
  importedAt: string
  moduleName: string
}

export interface KBEntry {
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

export interface AnalysisResult {
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

export interface LLMConfig {
  provider: 'ollama' | 'openai' | 'anthropic'
  baseURL?: string
  apiKey?: string
  model: string
  embeddingModel?: string
}

export interface Report {
  id: string
  title: string
  generatedAt: string
  analysisResult: AnalysisResult
  moduleNames: string[]
  question: string
  htmlContent: string
}

const api = {
  // Log Cleaning
  logCleaning: {
    importFiles: (paths: string[]): Promise<ImportedFile[]> =>
      ipcRenderer.invoke('logCleaning:importFiles', paths),
    detectModule: (filePath: string): Promise<string | null> =>
      ipcRenderer.invoke('logCleaning:detectModule', filePath),
    cleanLogs: (files: Array<{ path: string; moduleName: string }>): Promise<CleanedLogEntry[]> =>
      ipcRenderer.invoke('logCleaning:cleanLogs', files),
    getRules: (): Promise<CleaningRule[]> =>
      ipcRenderer.invoke('logCleaning:getRules'),
    saveRule: (rule: CleaningRule): Promise<void> =>
      ipcRenderer.invoke('logCleaning:saveRule', rule),
    deleteRule: (ruleId: string): Promise<void> =>
      ipcRenderer.invoke('logCleaning:deleteRule', ruleId)
  },

  // Knowledge Base
  knowledgeBase: {
    getModules: (): Promise<string[]> =>
      ipcRenderer.invoke('kb:getModules'),
    getEntries: (moduleName: string, type: 'Normal' | 'Error', options?: { offset?: number; limit?: number }): Promise<KBEntry[]> =>
      ipcRenderer.invoke('kb:getEntries', moduleName, type, options),
    searchEntries: (query: string, moduleNames?: string[]): Promise<KBEntry[]> =>
      ipcRenderer.invoke('kb:searchEntries', query, moduleNames),
    addEntries: (moduleName: string, type: 'Normal' | 'Error', entries: KBEntry[]): Promise<void> =>
      ipcRenderer.invoke('kb:addEntries', moduleName, type, entries),
    deleteEntries: (moduleName: string, type: 'Normal' | 'Error', entryIds: string[]): Promise<void> =>
      ipcRenderer.invoke('kb:deleteEntries', moduleName, type, entryIds),
    exportKB: (moduleName: string, type: 'Normal' | 'Error'): Promise<string> =>
      ipcRenderer.invoke('kb:exportKB', moduleName, type),
    getStatistics: (moduleName: string): Promise<{ totalEntries: number; dateRange?: { from: string; to: string } }> =>
      ipcRenderer.invoke('kb:getStatistics', moduleName)
  },

  // Analysis
  analysis: {
    analyze: (question: string, moduleNames?: string[]): Promise<AnalysisResult> =>
      ipcRenderer.invoke('analysis:analyze', question, moduleNames),
    getHistory: (): Promise<AnalysisResult[]> =>
      ipcRenderer.invoke('analysis:getHistory')
  },

  // LLM Settings
  llm: {
    getConfig: (): Promise<LLMConfig | null> =>
      ipcRenderer.invoke('llm:getConfig'),
    saveConfig: (config: LLMConfig): Promise<boolean> =>
      ipcRenderer.invoke('llm:saveConfig', config),
    healthCheck: (): Promise<{ ok: boolean; latency?: number; error?: string }> =>
      ipcRenderer.invoke('llm:healthCheck')
  },

  // Report
  report: {
    generate: (analysisResult: AnalysisResult, options?: { title?: string }): Promise<Report> =>
      ipcRenderer.invoke('report:generate', analysisResult, options),
    getReports: (): Promise<Report[]> =>
      ipcRenderer.invoke('report:getReports'),
    getReport: (reportId: string): Promise<Report | null> =>
      ipcRenderer.invoke('report:getReport', reportId),
    importToCaseKB: (reportId: string, caseName: string): Promise<void> =>
      ipcRenderer.invoke('report:importToCaseKB', reportId, caseName)
  },

  // Utility
  util: {
    selectFiles: (): Promise<string[]> =>
      ipcRenderer.invoke('util:selectFiles'),
    selectDirectory: (): Promise<string | null> =>
      ipcRenderer.invoke('util:selectDirectory'),
    showInFolder: (path: string): Promise<void> =>
      ipcRenderer.invoke('util:showInFolder', path),
    getAppVersion: (): Promise<string> =>
      ipcRenderer.invoke('util:getAppVersion')
  }
}

contextBridge.exposeInMainWorld('api', api)
