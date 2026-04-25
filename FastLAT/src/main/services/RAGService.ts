import { LLMService, AnalysisResult } from './LLMService'
import { KnowledgeBaseService, KBEntry } from './KnowledgeBaseService'
import { v4 as uuidv4 } from 'uuid'

export class RAGService {
  private llmService: LLMService
  private kbService: KnowledgeBaseService
  private history: AnalysisResult[] = []
  private maxHistory = 50

  constructor(llmService: LLMService, kbService: KnowledgeBaseService) {
    this.llmService = llmService
    this.kbService = kbService
  }

  async analyze(question: string, moduleNames?: string[]): Promise<AnalysisResult> {
    const startTime = Date.now()
    const modules = moduleNames || await this.kbService.getModules()

    if (modules.length === 0) {
      return {
        success: false,
        summary: 'No knowledge base entries found. Please import and clean logs first.',
        keyIssues: [],
        errorDetails: [],
        recommendations: ['Import log files and run cleaning to build the knowledge base'],
        contextCount: 0,
        processingTime: Date.now() - startTime
      }
    }

    try {
      // Step 1: Retrieve relevant context from knowledge base
      const contextEntries = await this.retrieveContext(question, modules)

      if (contextEntries.length === 0) {
        return {
          success: false,
          summary: 'No relevant entries found in knowledge base for your query.',
          keyIssues: [],
          errorDetails: [],
          recommendations: ['Try different keywords or import more log data'],
          contextCount: 0,
          processingTime: Date.now() - startTime
        }
      }

      // Step 2: Build context string
      const context = this.buildContext(contextEntries)

      // Step 3: Generate analysis using LLM
      const analysisText = await this.generateAnalysis(question, context)

      // Step 4: Parse and structure the result
      const parsed = this.llmService.parseAnalysisResponse(analysisText)

      const result: AnalysisResult = {
        success: true,
        summary: parsed.summary || analysisText.substring(0, 500),
        keyIssues: parsed.keyIssues || [],
        errorDetails: parsed.errorDetails || [],
        recommendations: parsed.recommendations || [],
        relatedModules: this.extractRelatedModules(contextEntries),
        contextCount: contextEntries.length,
        processingTime: Date.now() - startTime
      }

      // Add to history
      this.addToHistory(result)

      return result
    } catch (error: any) {
      return {
        success: false,
        summary: `Analysis failed: ${error.message}`,
        keyIssues: [],
        errorDetails: [],
        recommendations: ['Check LLM configuration and knowledge base'],
        contextCount: 0,
        processingTime: Date.now() - startTime
      }
    }
  }

  private async retrieveContext(question: string, modules: string[]): Promise<KBEntry[]> {
    const allEntries: KBEntry[] = []
    const queryLower = question.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2)

    for (const moduleName of modules) {
      const { normal, error } = await this.kbService.getAllEntriesForModule(moduleName)

      for (const entry of [...normal, ...error]) {
        // Calculate relevance score
        let score = 0
        const contentLower = entry.cleanedContent.toLowerCase()
        const keywordsLower = entry.keywords.map(k => k.toLowerCase())

        // Word match scoring
        for (const word of queryWords) {
          if (contentLower.includes(word)) score += 2
          if (keywordsLower.some(k => k.includes(word))) score += 3
        }

        // Error entries get higher priority for analysis
        if (entry.metadata.type === 'Error') score += 5
        if (entry.metadata.errorCode) score += 3

        if (score > 0) {
          allEntries.push({ ...entry, keywords: [score.toString()] as any })
        }
      }
    }

    // Sort by relevance and take top entries
    allEntries.sort((a, b) => {
      const scoreA = parseFloat(a.keywords[0] || '0')
      const scoreB = parseFloat(b.keywords[0] || '0')
      return scoreB - scoreA
    })

    return allEntries.slice(0, 20)
  }

  private buildContext(entries: KBEntry[]): string {
    const lines: string[] = []

    for (const entry of entries) {
      const type = entry.metadata.type
      const timestamp = entry.timestamp || 'N/A'
      const source = entry.metadata.sourceFile || ''
      const errorCode = entry.metadata.errorCode || ''
      const content = entry.cleanedContent

      let line = `[${timestamp}] [${type}]`
      if (source) line += ` [${source}]`
      if (errorCode) line += ` [${errorCode}]`
      line += `: ${content}`

      lines.push(line)
    }

    return lines.join('\n\n')
  }

  private async generateAnalysis(question: string, context: string): Promise<string> {
    const config = this.llmService.getConfig()

    const systemPrompt = `You are an expert log analysis engineer. Your task is to analyze log data and provide accurate, actionable insights.

INSTRUCTIONS:
1. Base your analysis STRICTLY on the provided log context
2. Structure your response with: Summary, Key Issues, Error Details, Recommendations
3. Focus on actionable findings with timestamps and error codes
4. Identify cross-module correlations using timestamps when available
5. Acknowledge limitations if log data is insufficient
6. Keep recommendations practical and implementable

CONTEXT (log entries):
${context}

Question: ${question}`

    const userPrompt = `Please analyze the provided log entries and answer: ${question}`

    try {
      if (!config) {
        // Return structured fallback if no LLM configured
        return this.generateFallbackAnalysis(question, context)
      }

      const response = await this.llmService.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ])

      return response
    } catch (error: any) {
      console.error('LLM chat failed:', error)
      return this.generateFallbackAnalysis(question, context)
    }
  }

  private generateFallbackAnalysis(question: string, context: string): string {
    // Parse context to generate basic analysis
    const entries = context.split('\n\n')
    const errorEntries = entries.filter(e => e.includes('[Error]'))
    const errorCodes = new Set<string>()

    for (const entry of entries) {
      const match = entry.match(/\[(ERR_[A-Z_]+|ERROR_\w+)\]/)
      if (match) {
        errorCodes.add(match[1])
      }
    }

    const summary = `Based on the ${entries.length} log entries analyzed, ${errorEntries.length} entries contain error conditions. ${errorCodes.size} unique error codes were detected.`

    const keyIssues = [
      `${errorEntries.length} error-level log entries require attention`,
      `${errorCodes.size} distinct error patterns identified`
    ]

    const recommendations = [
      'Review error entries in chronological order to identify root cause',
      'Check system logs for correlated failures around the same timestamps'
    ]

    return JSON.stringify({
      summary,
      keyIssues,
      errorDetails: errorEntries.slice(0, 5).map(e => ({
        timestamp: (e.match(/^\[([^\]]+)\]/) || ['', ''])[1],
        description: e.substring(0, 200)
      })),
      recommendations
    }, null, 2)
  }

  private extractRelatedModules(entries: KBEntry[]): string[] {
    const modules = new Set<string>()
    for (const entry of entries) {
      if (entry.metadata.moduleName) {
        modules.add(entry.metadata.moduleName)
      }
    }
    return [...modules]
  }

  private addToHistory(result: AnalysisResult): void {
    this.history.unshift(result)
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory)
    }
  }

  getHistory(): AnalysisResult[] {
    return [...this.history]
  }
}
