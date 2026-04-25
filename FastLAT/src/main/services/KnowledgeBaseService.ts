import * as fs from 'fs'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

export interface KBEntry {
  id: string
  timestamp: string
  rawContent: string
  cleanedContent: string
  keywords: string[]
  embedding?: number[]
  metadata: {
    moduleName: string
    type: 'Normal' | 'Error'
    sourceFile: string
    lineNumber: number
    errorCode?: string
    severity?: string
  }
}

export interface KBDocument {
  version: string
  moduleName: string
  type: 'Normal' | 'Error'
  createdAt: string
  updatedAt: string
  entries: KBEntry[]
  statistics: {
    totalEntries: number
    dateRange?: { from: string; to: string }
    errorCodes?: Record<string, number>
  }
}

export class KnowledgeBaseService {
  private basePath: string = ''
  private embeddingCache: Map<string, number[]> = new Map()
  private minisearch: any = null

  async initialize(basePath: string): Promise<void> {
    this.basePath = basePath
    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true })
    }
    // Initialize MiniSearch for text search (optional - fallback to simple search)
    try {
      const MiniSearch = (await import('minisearch')).default
      this.minisearch = new MiniSearch({
        fields: ['cleanedContent', 'keywords'],
        storeFields: ['id', 'timestamp', 'cleanedContent', 'keywords', 'metadata']
      })
    } catch (e) {
      console.warn('MiniSearch not available, using simple text search')
    }
  }

  private getKBPath(moduleName: string, type: 'Normal' | 'Error'): string {
    return path.join(this.basePath, moduleName, `${moduleName}_${type}.json`)
  }

  private async loadKB(moduleName: string, type: 'Normal' | 'Error'): Promise<KBDocument> {
    const kbPath = this.getKBPath(moduleName, type)
    try {
      if (fs.existsSync(kbPath)) {
        const content = fs.readFileSync(kbPath, 'utf-8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.error('Failed to load KB:', error)
    }
    return this.createEmptyKB(moduleName, type)
  }

  private async saveKB(moduleName: string, type: 'Normal' | 'Error', doc: KBDocument): Promise<void> {
    const kbPath = this.getKBPath(moduleName, type)
    const dir = path.dirname(kbPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    doc.updatedAt = new Date().toISOString()
    doc.statistics.totalEntries = doc.entries.length
    fs.writeFileSync(kbPath, JSON.stringify(doc, null, 2))
  }

  private createEmptyKB(moduleName: string, type: 'Normal' | 'Error'): KBDocument {
    return {
      version: '1.0',
      moduleName,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      entries: [],
      statistics: { totalEntries: 0 }
    }
  }

  async addEntries(moduleName: string, type: 'Normal' | 'Error', entries: KBEntry[]): Promise<void> {
    const doc = await this.loadKB(moduleName, type)

    // Add new entries
    for (const entry of entries) {
      if (!entry.id) {
        entry.id = uuidv4()
      }
      doc.entries.push(entry)
    }

    // Update date range
    if (doc.entries.length > 0) {
      const timestamps = doc.entries.map(e => e.timestamp).filter(t => t)
      if (timestamps.length > 0) {
        doc.statistics.dateRange = {
          from: timestamps.sort()[0],
          to: timestamps.sort()[timestamps.length - 1]
        }
      }
    }

    // Update error code stats for Error KB
    if (type === 'Error') {
      const errorCodes: Record<string, number> = {}
      for (const entry of doc.entries) {
        if (entry.metadata.errorCode) {
          errorCodes[entry.metadata.errorCode] = (errorCodes[entry.metadata.errorCode] || 0) + 1
        }
      }
      doc.statistics.errorCodes = errorCodes
    }

    await this.saveKB(moduleName, type, doc)
  }

  async getEntries(
    moduleName: string,
    type: 'Normal' | 'Error',
    options?: { offset?: number; limit?: number }
  ): Promise<KBEntry[]> {
    const doc = await this.loadKB(moduleName, type)
    const offset = options?.offset || 0
    const limit = options?.limit || 1000
    return doc.entries.slice(offset, offset + limit)
  }

  async textSearch(query: string, moduleNames?: string[]): Promise<KBEntry[]> {
    const results: KBEntry[] = []
    const modules = moduleNames || await this.getModules()

    for (const moduleName of modules) {
      for (const type of ['Normal', 'Error'] as const) {
        const doc = await this.loadKB(moduleName, type)
        const queryLower = query.toLowerCase()

        for (const entry of doc.entries) {
          // Simple text search
          const contentMatch = entry.cleanedContent.toLowerCase().includes(queryLower)
          const keywordMatch = entry.keywords.some(k => k.toLowerCase().includes(queryLower))
          const errorCodeMatch = entry.metadata.errorCode?.toLowerCase().includes(queryLower)

          if (contentMatch || keywordMatch || errorCodeMatch) {
            results.push(entry)
          }
        }
      }
    }

    return results.slice(0, 100)
  }

  async deleteEntries(moduleName: string, type: 'Normal' | 'Error', entryIds: string[]): Promise<void> {
    const doc = await this.loadKB(moduleName, type)
    doc.entries = doc.entries.filter(e => !entryIds.includes(e.id))
    await this.saveKB(moduleName, type, doc)
  }

  async exportKB(moduleName: string, type: 'Normal' | 'Error'): Promise<string> {
    const doc = await this.loadKB(moduleName, type)
    return JSON.stringify(doc, null, 2)
  }

  async getStatistics(moduleName: string): Promise<{ totalEntries: number; dateRange?: { from: string; to: string } }> {
    let totalNormal = 0
    let totalError = 0
    let dateRange: { from: string; to: string } | undefined

    for (const type of ['Normal', 'Error'] as const) {
      const doc = await this.loadKB(moduleName, type)
      if (type === 'Normal') {
        totalNormal = doc.statistics.totalEntries
      } else {
        totalError = doc.statistics.totalEntries
      }
      if (doc.statistics.dateRange) {
        if (!dateRange) {
          dateRange = doc.statistics.dateRange
        } else {
          if (doc.statistics.dateRange.from < dateRange.from) {
            dateRange.from = doc.statistics.dateRange.from
          }
          if (doc.statistics.dateRange.to > dateRange.to) {
            dateRange.to = doc.statistics.dateRange.to
          }
        }
      }
    }

    return { totalEntries: totalNormal + totalError, dateRange }
  }

  async getModules(): Promise<string[]> {
    if (!fs.existsSync(this.basePath)) {
      return []
    }
    const entries = fs.readdirSync(this.basePath, { withFileTypes: true })
    return entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
  }

  async getAllEntriesForModule(moduleName: string): Promise<{ normal: KBEntry[]; error: KBEntry[] }> {
    const [normal, error] = await Promise.all([
      this.getEntries(moduleName, 'Normal'),
      this.getEntries(moduleName, 'Error')
    ])
    return { normal, error }
  }
}
