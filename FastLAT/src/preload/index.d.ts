export {}

declare global {
  interface Window {
    api: {
      logCleaning: {
        importFiles: (paths: string[]) => Promise<ImportedFile[]>
        detectModule: (filePath: string) => Promise<string | null>
        cleanLogs: (files: Array<{ path: string; moduleName: string }>) => Promise<CleanedLogEntry[]>
        getModuleConfigs: () => Promise<ModuleConfig[]>
        getModuleNames: () => Promise<string[]>
        getRules: () => Promise<CleaningRule[]>
        saveRule: (rule: CleaningRule) => Promise<{ success: boolean }>
        deleteRule: (ruleId: string) => Promise<{ success: boolean }>
        exportRules: () => Promise<string>
        importRules: (jsonContent: string) => Promise<{ imported: number; errors: string }>
      }
      knowledgeBase: {
        getModules: () => Promise<string[]>
        getEntries: (moduleName: string, type: 'Normal' | 'Error', options?: { offset?: number; limit?: number }) => Promise<KBEntry[]>
        searchEntries: (query: string, moduleNames?: string[]) => Promise<KBEntry[]>
        addEntries: (moduleName: string, type: 'Normal' | 'Error', entries: KBEntry[]) => Promise<void>
        deleteEntries: (moduleName: string, type: 'Normal' | 'Error', entryIds: string[]) => Promise<void>
        exportKB: (moduleName: string, type: 'Normal' | 'Error') => Promise<string>
        getStatistics: (moduleName: string) => Promise<{ totalEntries: number; dateRange?: { from: string; to: string } }>
      }
      analysis: {
        analyze: (question: string, moduleNames?: string[]) => Promise<AnalysisResult>
        getHistory: () => Promise<AnalysisResult[]>
      }
      llm: {
        getConfig: () => Promise<LLMConfig | null>
        saveConfig: (config: LLMConfig) => Promise<boolean>
        healthCheck: () => Promise<{ ok: boolean; latency?: number; error?: string }>
      }
      report: {
        generate: (analysisResult: AnalysisResult, options?: { title?: string }) => Promise<Report>
        getReports: () => Promise<Report[]>
        getReport: (reportId: string) => Promise<Report | null>
        importToCaseKB: (reportId: string, caseName: string) => Promise<void>
      }
      util: {
        selectFiles: () => Promise<string[]>
        selectDirectory: () => Promise<string | null>
        showInFolder: (path: string) => Promise<void>
        getAppVersion: () => Promise<string>
      }
    }
  }
}

interface ModuleConfig {
  moduleName: string
  rules: CleaningRule[]
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

interface CleanedLogEntry {
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

interface ImportedFile {
  id: string
  name: string
  path: string
  size: number
  importedAt: string
  moduleName: string
  logNamePrefix?: string
}

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

interface LLMConfig {
  provider: 'ollama' | 'openai' | 'anthropic'
  baseURL?: string
  apiKey?: string
  model: string
  embeddingModel?: string
}

interface Report {
  id: string
  title: string
  generatedAt: string
  analysisResult: AnalysisResult
  moduleNames: string[]
  question: string
  htmlContent: string
}
