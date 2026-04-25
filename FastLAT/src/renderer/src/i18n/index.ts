import { ref, computed } from 'vue'

export type Locale = 'en' | 'zh'

const translations = {
  en: {
    app: {
      title: 'FastLAT',
      version: 'v1.0.0'
    },
    nav: {
      logImport: 'Log Import',
      analysis: 'Analysis',
      knowledgeBase: 'Knowledge Base',
      logTrend: 'Log Trend',
      reports: 'Reports',
      settings: 'Settings'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      refresh: 'Refresh',
      export: 'Export',
      import: 'Import',
      enabled: 'Enabled',
      disabled: 'Disabled',
      success: 'Success',
      failed: 'Failed',
      loading: 'Loading...',
      noData: 'No data',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      version: 'Version'
    },
    settings: {
      title: 'Settings',
      llmConfig: 'LLM Configuration',
      provider: 'Provider',
      baseURL: 'Base URL',
      apiKey: 'API Key',
      model: 'Model',
      embeddingModel: 'Embedding Model',
      testConnection: 'Test Connection',
      connectionSuccess: 'Connection successful!',
      connectionFailed: 'Connection failed',
      dataManagement: 'Data Management',
      kbSize: 'Knowledge Base Size',
      moduleCount: 'Number of Modules',
      reportsCount: 'Reports Count',
      openDataFolder: 'Open Data Folder',
      clearKB: 'Clear Knowledge Base',
      clearKBConfirm: 'Are you sure you want to clear all knowledge base data? This action cannot be undone.',
      about: 'About',
      aboutDesc: 'A desktop application for intelligent log analysis using RAG and LLM technologies.'
    },
    knowledgeBase: {
      title: 'Knowledge Base',
      selectModule: 'Select Module',
      selectModulePlaceholder: 'Select a module...',
      normalLogs: 'Normal Logs',
      errorLogs: 'Error Logs',
      searchEntries: 'Search entries...',
      timestamp: 'Timestamp',
      content: 'Content',
      keywords: 'Keywords',
      source: 'Source',
      actions: 'Actions',
      view: 'View',
      totalEntries: 'Total Entries',
      dateRange: 'Date Range',
      tableView: 'Table View',
      jsonView: 'JSON View',
      entryDetails: 'Entry Details',
      id: 'ID',
      lineNumber: 'Line Number',
      errorCode: 'Error Code',
      severity: 'Severity',
      rawContent: 'Raw Content',
      cleanedContent: 'Cleaned Content',
      addToAnalysis: 'Add to Analysis'
    },
    logImport: {
      title: 'Log Import & Cleaning',
      selectFiles: 'Select Log Files',
      dropHint: 'Supported: .log, .txt files',
      selectedFiles: 'Selected Files',
      fileName: 'File Name',
      size: 'Size',
      detectedModule: 'Detected Module',
      actions: 'Actions',
      remove: 'Remove',
      cleaningRules: 'Cleaning Rules',
      addRule: 'Add Rule',
      addModule: 'Add Module',
      editModule: 'Edit Module',
      editRule: 'Edit Rule',
      deleteRule: 'Delete Rule',
      enableRule: 'Enable',
      disableRule: 'Disable',
      startCleaning: 'Start Cleaning',
      cleaningProgress: 'Cleaning Progress',
      entriesProcessed: 'entries processed',
      cleaningResults: 'Cleaning Results',
      module: 'Module',
      totalLines: 'Total Lines',
      normal: 'Normal',
      error: 'Error',
      importRules: 'Import Rules',
      exportRules: 'Export Rules',
      rulesImported: 'Rules imported successfully',
      rulesExported: 'Rules exported successfully',
      rules: 'rules',
      logNamePrefixPlaceholder: 'e.g., diam, http, error'
    },
    analysis: {
      title: 'Log Analysis',
      selectModules: 'Select Modules',
      askQuestion: 'Ask a question...',
      analyze: 'Analyze',
      analyzing: 'Analyzing...',
      summary: 'Summary',
      keyIssues: 'Key Issues',
      errorDetails: 'Error Details',
      recommendations: 'Recommendations',
      relatedModules: 'Related Modules',
      contextCount: 'Context Count',
      processingTime: 'Processing Time',
      generateReport: 'Generate Report',
      analysisHistory: 'Analysis History'
    },
    reports: {
      title: 'Reports',
      reportList: 'Report List',
      generateNew: 'Generate New',
      reportTitle: 'Report Title',
      generatedAt: 'Generated At',
      module: 'Module',
      question: 'Question',
      viewReport: 'View Report',
      deleteReport: 'Delete Report',
      importToCaseKB: 'Import to Case KB',
      noReports: 'No reports generated yet.'
    },
    trend: {
      title: 'Log Trend',
      timeRange: 'Time Range',
      module: 'Module',
      normalCount: 'Normal Count',
      errorCount: 'Error Count',
      errorRate: 'Error Rate'
    },
    status: {
      ready: 'Ready',
      processing: 'Processing',
      error: 'Error'
    }
  },
  zh: {
    app: {
      title: 'FastLAT',
      version: 'v1.0.0'
    },
    nav: {
      logImport: '日志导入',
      analysis: '日志分析',
      knowledgeBase: '知识库',
      logTrend: '日志趋势',
      reports: '报告',
      settings: '设置'
    },
    common: {
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      search: '搜索',
      refresh: '刷新',
      export: '导出',
      import: '导入',
      enabled: '已启用',
      disabled: '已禁用',
      success: '成功',
      failed: '失败',
      loading: '加载中...',
      noData: '暂无数据'
    },
    settings: {
      title: '设置',
      llmConfig: 'LLM 配置',
      provider: '供应商',
      baseURL: '基础 URL',
      apiKey: 'API 密钥',
      model: '模型',
      embeddingModel: '嵌入模型',
      testConnection: '测试连接',
      connectionSuccess: '连接成功！',
      connectionFailed: '连接失败',
      dataManagement: '数据管理',
      kbSize: '知识库大小',
      moduleCount: '模块数量',
      reportsCount: '报告数量',
      openDataFolder: '打开数据文件夹',
      clearKB: '清空知识库',
      clearKBConfirm: '确定要清空所有知识库数据吗？此操作无法撤销。',
      about: '关于',
      aboutDesc: '一款基于 RAG 和 LLM 技术的智能日志分析桌面应用。'
    },
    knowledgeBase: {
      title: '知识库',
      selectModule: '选择模块',
      selectModulePlaceholder: '请选择模块...',
      normalLogs: '正常日志',
      errorLogs: '错误日志',
      searchEntries: '搜索条目...',
      timestamp: '时间戳',
      content: '内容',
      keywords: '关键词',
      source: '来源',
      actions: '操作',
      view: '查看',
      totalEntries: '总条目数',
      dateRange: '日期范围',
      tableView: '表格视图',
      jsonView: 'JSON 视图',
      entryDetails: '条目详情',
      id: 'ID',
      lineNumber: '行号',
      errorCode: '错误码',
      severity: '严重程度',
      rawContent: '原始内容',
      cleanedContent: '清洗后内容',
      addToAnalysis: '添加到分析'
    },
    logImport: {
      title: '日志导入与清洗',
      selectFiles: '选择日志文件',
      dropHint: '支持：.log, .txt 文件',
      selectedFiles: '已选文件',
      fileName: '文件名',
      size: '大小',
      detectedModule: '检测到的模块',
      actions: '操作',
      remove: '移除',
      cleaningRules: '清洗规则',
      addRule: '添加规则',
      moduleName: '模块名称',
      pattern: '正则表达式',
      status: '状态',
      timestampGroup: '时间戳分组',
      levelGroup: '级别分组',
      contentGroup: '内容分组',
      logNamePrefix: '日志名前缀',
      editRule: '编辑规则',
      deleteRule: '删除规则',
      enableRule: '启用',
      disableRule: '禁用',
      startCleaning: '开始清洗',
      cleaningProgress: '清洗进度',
      entriesProcessed: '条目已处理',
      cleaningResults: '清洗结果',
      module: '模块',
      totalLines: '总行数',
      normal: '正常',
      error: '错误',
      importRules: '导入规则',
      exportRules: '导出规则',
      rulesImported: '规则导入成功',
      rulesExported: '规则导出成功',
      rules: '条规则',
      logNamePrefixPlaceholder: '例如：diam, http, error',
      addModule: '添加模块',
      editModule: '编辑模块'
    },
    analysis: {
      title: '日志分析',
      selectModules: '选择模块',
      askQuestion: '输入问题...',
      analyze: '分析',
      analyzing: '分析中...',
      summary: '摘要',
      keyIssues: '关键问题',
      errorDetails: '错误详情',
      recommendations: '建议',
      relatedModules: '相关模块',
      contextCount: '上下文数量',
      processingTime: '处理时间',
      generateReport: '生成报告',
      analysisHistory: '分析历史'
    },
    reports: {
      title: '报告',
      reportList: '报告列表',
      generateNew: '生成新报告',
      reportTitle: '报告标题',
      generatedAt: '生成时间',
      module: '模块',
      question: '问题',
      viewReport: '查看报告',
      deleteReport: '删除报告',
      importToCaseKB: '导入到案例库',
      noReports: '暂无报告。'
    },
    trend: {
      title: '日志趋势',
      timeRange: '时间范围',
      module: '模块',
      normalCount: '正常数量',
      errorCount: '错误数量',
      errorRate: '错误率'
    },
    status: {
      ready: '就绪',
      processing: '处理中',
      error: '错误'
    }
  }
}

const currentLocale = ref<Locale>('en')

export function useI18n() {
  const locale = computed({
    get: () => currentLocale.value,
    set: (val: Locale) => { currentLocale.value = val }
  })

  const t = (key: string): string => {
    const keys = key.split('.')
    let result: any = translations[currentLocale.value]
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k]
      } else {
        return key
      }
    }
    return typeof result === 'string' ? result : key
  }

  return {
    locale,
    t
  }
}

export { translations }
