import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Log name prefix rule - a module can have multiple rules with different log name prefixes
export interface CleaningRule {
  id: string
  moduleName: string
  logNamePrefix: string  // e.g., "diam", "http", "diam-error"
  pattern: string
  timestampGroup: number
  levelGroup: number
  contentGroup: number
  multiline: boolean
  enabled: boolean
}

// Module configuration - contains multiple rules for different log name prefixes
export interface ModuleConfig {
  moduleName: string
  rules: CleaningRule[]
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

export interface CleaningResult {
  success: boolean
  moduleName: string
  totalLines: number
  normalCount: number
  errorCount: number
  cleanedEntries: CleanedLogEntry[]
}

export interface ImportedFile {
  id: string
  name: string
  path: string
  size: number
  importedAt: string
  moduleName: string
  logNamePrefix?: string
}

export class LogCleaningService {
  private moduleConfigs: ModuleConfig[] = []

  async loadRules(configPath: string): Promise<void> {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8')
        const config = JSON.parse(content)
        this.moduleConfigs = config.moduleConfigs || []
      } else {
        this.moduleConfigs = this.getDefaultModuleConfigs()
        this.saveRules(configPath)
      }
    } catch (error) {
      console.error('Failed to load cleaning rules:', error)
      this.moduleConfigs = this.getDefaultModuleConfigs()
    }
  }

  private getDefaultModuleConfigs(): ModuleConfig[] {
    return [
      {
        moduleName: 'DiamAdapter',
        rules: [
          {
            id: 'rule-default-1',
            moduleName: 'DiamAdapter',
            logNamePrefix: 'diam',
            pattern: '\\[(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3})\\] \\[(\\w+)\\] (.+)',
            timestampGroup: 1,
            levelGroup: 2,
            contentGroup: 3,
            multiline: false,
            enabled: true
          }
        ]
      },
      {
        moduleName: 'HTTPAdapter',
        rules: [
          {
            id: 'rule-default-2',
            moduleName: 'HTTPAdapter',
            logNamePrefix: 'http',
            pattern: '(\\d{4}/\\d{2}/\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}) \\[(\\w+)\\] (.+)',
            timestampGroup: 1,
            levelGroup: 2,
            contentGroup: 3,
            multiline: false,
            enabled: true
          }
        ]
      }
    ]
  }

  private async saveRules(configPath: string): Promise<void> {
    const dir = path.dirname(configPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const config = { version: '2.0', moduleConfigs: this.moduleConfigs }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  }

  // Get all module names
  getModuleNames(): string[] {
    return this.moduleConfigs.map(m => m.moduleName)
  }

  // Get all rules for a specific module
  getRulesForModule(moduleName: string): CleaningRule[] {
    const moduleConfig = this.moduleConfigs.find(m => m.moduleName === moduleName)
    return moduleConfig ? moduleConfig.rules.filter(r => r.enabled) : []
  }

  // Get all rules across all modules
  getAllRules(): CleaningRule[] {
    return this.moduleConfigs.flatMap(m => m.rules).filter(r => r.enabled)
  }

  // Get all module configs
  getModuleConfigs(): ModuleConfig[] {
    return this.moduleConfigs
  }

  // Save a rule (add or update)
  async saveRule(rule: CleaningRule, configPath: string): Promise<void> {
    // Find or create module config
    let moduleConfig = this.moduleConfigs.find(m => m.moduleName === rule.moduleName)
    if (!moduleConfig) {
      moduleConfig = { moduleName: rule.moduleName, rules: [] }
      this.moduleConfigs.push(moduleConfig)
    }

    // Find or create rule within module
    const existingIndex = moduleConfig.rules.findIndex(r => r.id === rule.id)
    if (existingIndex >= 0) {
      moduleConfig.rules[existingIndex] = rule
    } else {
      moduleConfig.rules.push(rule)
    }

    await this.saveRules(configPath)
  }

  // Delete a rule
  async deleteRule(ruleId: string, configPath: string): Promise<void> {
    for (const moduleConfig of this.moduleConfigs) {
      const idx = moduleConfig.rules.findIndex(r => r.id === ruleId)
      if (idx >= 0) {
        moduleConfig.rules.splice(idx, 1)
        break
      }
    }
    // Remove empty modules
    this.moduleConfigs = this.moduleConfigs.filter(m => m.rules.length > 0)
    await this.saveRules(configPath)
  }

  // Add a new module with initial rule
  async addModuleConfig(moduleConfig: ModuleConfig, configPath: string): Promise<void> {
    const existing = this.moduleConfigs.find(m => m.moduleName === moduleConfig.moduleName)
    if (!existing) {
      this.moduleConfigs.push(moduleConfig)
    } else {
      // Merge rules
      for (const rule of moduleConfig.rules) {
        if (!existing.rules.find(r => r.id === rule.id)) {
          existing.rules.push(rule)
        }
      }
    }
    await this.saveRules(configPath)
  }

  // Delete entire module config
  async deleteModuleConfig(moduleName: string, configPath: string): Promise<void> {
    this.moduleConfigs = this.moduleConfigs.filter(m => m.moduleName !== moduleName)
    await this.saveRules(configPath)
  }

  // Export all rules to JSON string
  exportRules(): string {
    return JSON.stringify({ version: '2.0', moduleConfigs: this.moduleConfigs }, null, 2)
  }

  // Import rules from JSON string
  async importRules(jsonContent: string, configPath: string): Promise<{ imported: number; errors: string }> {
    try {
      const data = JSON.parse(jsonContent)
      let imported = 0

      if (data.moduleConfigs && Array.isArray(data.moduleConfigs)) {
        for (const moduleConfig of data.moduleConfigs) {
          if (moduleConfig.moduleName && moduleConfig.rules) {
            await this.addModuleConfig(moduleConfig, configPath)
            imported += moduleConfig.rules.length
          }
        }
      } else if (data.rules && Array.isArray(data.rules)) {
        // Legacy format - convert to new format
        for (const rule of data.rules) {
          if (rule.moduleName && rule.pattern) {
            await this.saveRule(rule, configPath)
            imported++
          }
        }
      }

      return { imported, errors: '' }
    } catch (error) {
      return { imported: 0, errors: String(error) }
    }
  }

  async importFiles(filePaths: string[]): Promise<ImportedFile[]> {
    const results: ImportedFile[] = []
    for (const filePath of filePaths) {
      const stats = fs.statSync(filePath)
      const { moduleName, logNamePrefix } = await this.detectModuleAndPrefix(filePath) || { moduleName: 'Unknown', logNamePrefix: '' }
      results.push({
        id: uuidv4(),
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        importedAt: new Date().toISOString(),
        moduleName,
        logNamePrefix
      })
    }
    return results
  }

  async detectModuleAndPrefix(filePath: string): Promise<{ moduleName: string; logNamePrefix: string } | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const firstLines = content.split('\n').slice(0, 50).join('\n')
      const fileName = path.basename(filePath).toLowerCase()

      // First try to match by log name prefix in filename
      for (const moduleConfig of this.moduleConfigs) {
        for (const rule of moduleConfig.rules) {
          if (!rule.enabled) continue
          if (rule.logNamePrefix && fileName.includes(rule.logNamePrefix.toLowerCase())) {
            return { moduleName: moduleConfig.moduleName, logNamePrefix: rule.logNamePrefix }
          }
        }
      }

      // Then try to match by pattern content
      for (const moduleConfig of this.moduleConfigs) {
        for (const rule of moduleConfig.rules) {
          if (!rule.enabled) continue
          const regex = new RegExp(rule.pattern)
          if (regex.test(firstLines)) {
            return { moduleName: moduleConfig.moduleName, logNamePrefix: rule.logNamePrefix }
          }
        }
      }

      return null
    } catch {
      return null
    }
  }

  async detectModule(filePath: string): Promise<string | null> {
    const result = await this.detectModuleAndPrefix(filePath)
    return result ? result.moduleName : null
  }

  async cleanLogFile(
    filePath: string,
    moduleName: string,
    knowledgeBaseService: KnowledgeBaseServiceType
  ): Promise<CleaningResult> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      const fileName = path.basename(filePath).toLowerCase()

      // Find matching rule based on log name prefix
      const moduleConfig = this.moduleConfigs.find(m => m.moduleName === moduleName)
      if (!moduleConfig) {
        return {
          success: false,
          moduleName,
          totalLines: lines.length,
          normalCount: 0,
          errorCount: 0,
          cleanedEntries: []
        }
      }

      // Try to find rule by logNamePrefix first
      let rule = moduleConfig.rules.find(r => r.enabled && r.logNamePrefix && fileName.includes(r.logNamePrefix.toLowerCase()))
      if (!rule) {
        // Fall back to any enabled rule for the module
        rule = moduleConfig.rules.find(r => r.enabled)
      }

      if (!rule) {
        return {
          success: false,
          moduleName,
          totalLines: lines.length,
          normalCount: 0,
          errorCount: 0,
          cleanedEntries: []
        }
      }

      const regex = new RegExp(rule.pattern)
      const cleanedEntries: CleanedLogEntry[] = []
      let normalCount = 0
      let errorCount = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue

        const match = line.match(regex)
        if (match) {
          const timestamp = match[rule.timestampGroup] || ''
          const level = (match[rule.levelGroup] || 'UNKNOWN').toUpperCase() as CleanedLogEntry['level']
          const rawContent = line
          const cleanedContent = match[rule.contentGroup] || line

          const entry: CleanedLogEntry = {
            id: uuidv4(),
            timestamp: this.normalizeTimestamp(timestamp),
            rawContent,
            cleanedContent,
            level: this.parseLevel(level),
            keywords: this.extractKeywords(cleanedContent),
            lineNumber: i + 1,
            sourceFile: path.basename(filePath)
          }

          // Detect error code
          const errorCode = this.detectErrorCode(cleanedContent)
          if (errorCode) {
            entry.errorCode = errorCode
            entry.severity = this.determineSeverity(cleanedContent)
            errorCount++
          } else if (level === 'ERROR' || level === 'WARN') {
            entry.severity = level === 'ERROR' ? 'high' : 'medium'
            errorCount++
          } else {
            normalCount++
          }

          cleanedEntries.push(entry)
        }
      }

      // Add to knowledge base
      const normalEntries = cleanedEntries.filter(e => !e.errorCode && e.level !== 'ERROR' && e.level !== 'WARN')
      const errorEntries = cleanedEntries.filter(e => e.errorCode || e.level === 'ERROR' || e.level === 'WARN')

      if (normalEntries.length > 0) {
        await knowledgeBaseService.addEntries(moduleName, 'Normal',
          normalEntries.map(e => this.toKBEntry(e)))
      }
      if (errorEntries.length > 0) {
        await knowledgeBaseService.addEntries(moduleName, 'Error',
          errorEntries.map(e => this.toKBEntry(e)))
      }

      return {
        success: true,
        moduleName,
        totalLines: lines.length,
        normalCount,
        errorCount,
        cleanedEntries
      }
    } catch (error) {
      console.error('Failed to clean log file:', error)
      return {
        success: false,
        moduleName,
        totalLines: 0,
        normalCount: 0,
        errorCount: 0,
        cleanedEntries: []
      }
    }
  }

  async batchClean(
    files: Array<{ path: string; moduleName: string }>,
    knowledgeBaseService: KnowledgeBaseServiceType
  ): Promise<CleanedLogEntry[]> {
    const allEntries: CleanedLogEntry[] = []
    for (const file of files) {
      const result = await this.cleanLogFile(file.path, file.moduleName, knowledgeBaseService)
      allEntries.push(...result.cleanedEntries)
    }
    return allEntries
  }

  private normalizeTimestamp(timestamp: string): string {
    try {
      const normalized = timestamp.replace(/\//g, '-').replace(',', '.')
      const date = new Date(normalized)
      if (!isNaN(date.getTime())) {
        return date.toISOString()
      }
    } catch {}
    return timestamp
  }

  private parseLevel(level: string): CleanedLogEntry['level'] {
    const validLevels: CleanedLogEntry['level'][] = ['INFO', 'WARN', 'ERROR', 'DEBUG', 'UNKNOWN']
    return validLevels.includes(level as CleanedLogEntry['level']) ? level as CleanedLogEntry['level'] : 'UNKNOWN'
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3)
    return [...new Set(words)].slice(0, 10)
  }

  private detectErrorCode(content: string): string | null {
    const patterns = [
      /ERR_[A-Z_]+/i,
      /ERROR_[A-Z_]+/i,
      /E\d{4,}/i,
      /\[ERROR\]/i,
      /\[FATAL\]/i
    ]
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        return match[0]
      }
    }
    return null
  }

  private determineSeverity(content: string): CleanedLogEntry['severity'] {
    const lower = content.toLowerCase()
    if (lower.includes('fatal') || lower.includes('critical') || lower.includes('severe')) {
      return 'critical'
    }
    if (lower.includes('error') || lower.includes('fail') || lower.includes('exception')) {
      return 'high'
    }
    if (lower.includes('warn')) {
      return 'medium'
    }
    return 'low'
  }

  private toKBEntry(entry: CleanedLogEntry) {
    return {
      id: entry.id,
      timestamp: entry.timestamp,
      rawContent: entry.rawContent,
      cleanedContent: entry.cleanedContent,
      keywords: entry.keywords,
      metadata: {
        moduleName: '',
        type: 'Normal' as const,
        sourceFile: entry.sourceFile,
        lineNumber: entry.lineNumber,
        errorCode: entry.errorCode,
        severity: entry.severity
      }
    }
  }
}

// Type for KnowledgeBaseService (avoid circular import)
type KnowledgeBaseServiceType = {
  addEntries: (moduleName: string, type: 'Normal' | 'Error', entries: any[]) => Promise<void>
}
