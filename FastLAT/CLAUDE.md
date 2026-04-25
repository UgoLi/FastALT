# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev          # Run both main and renderer in dev mode (concurrently)
npm run dev:main     # Run main process only with TypeScript compilation
npm run dev:renderer # Run renderer (Vite dev server)
npm run build        # Build both main and renderer for production
npm run build:app    # Build full Electron app (includes packaging)
npx electron-builder --win --x64  # Build Windows executable specifically
```

**Note:** When running in development, use `npm run start` with `--no-sandbox` flag to avoid Electron sandbox issues.

## Architecture Overview

FastLAT is an Electron + Vue 3 + TypeScript desktop application for intelligent log analysis using RAG (Retrieval Augmented Generation) and LLM technologies.

### Process Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Main Process                          │
│  (src/main/index.ts)                                    │
│                                                          │
│  Services:                                               │
│  ├── LogCleaningService    - Log parsing & cleaning     │
│  ├── KnowledgeBaseService   - JSON file-based storage   │
│  ├── LLMService            - Ollama/OpenAI/Anthropic    │
│  ├── RAGService            - Retrieval + Generation    │
│  └── ReportService         - HTML report generation     │
│                                                          │
│  IPC Handlers bridge main ↔ renderer via contextBridge  │
└─────────────────────────────────────────────────────────┘
                           │
                           │ contextBridge (window.api)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Renderer Process                        │
│  (src/renderer/)                                       │
│                                                          │
│  Vue 3 Components:                                      │
│  ├── App.vue                   - Root + sidebar nav    │
│  ├── views/LogImport.vue       - File selection, rules  │
│  ├── views/KnowledgeBase.vue   - Browse/search KB       │
│  ├── views/LogAnalysis.vue     - RAG-powered analysis  │
│  ├── views/LogTrend.vue        - Visualization         │
│  ├── views/ReportView.vue      - View/generate reports │
│  └── views/Settings.vue        - LLM config, data mgmt│
│                                                          │
│  i18n/                          - EN/ZH translations    │
└─────────────────────────────────────────────────────────┘
```

### Data Storage

Data is stored in `app.getPath('userData')/data/`:
- `config/cleaningRules.json` - Module configs with cleaning rules
- `knowledge-base/` - Per-module JSON files (Normal/Error logs)
- `reports/` - Generated HTML reports
- `cases/` - Case knowledge bases

### Cleaning Rules Structure

```typescript
interface ModuleConfig {
  moduleName: string
  rules: CleaningRule[]
}

interface CleaningRule {
  id: string
  moduleName: string
  logNamePrefix: string  // e.g., "diam", "http" for file matching
  pattern: string       // Regex pattern
  timestampGroup: number
  levelGroup: number
  contentGroup: number
  multiline: boolean
  enabled: boolean
}
```

### IPC API Pattern

All IPC handlers follow the naming convention `domain:action` and are defined in `src/main/index.ts`. The renderer accesses them via `window.api.<domain>.<action>()` as typed in `src/preload/index.d.ts`.

### Key Dependencies

- `@electron-toolkit/utils` - Electron utilities (window creation, IPC)
- `dexie` - IndexedDB wrapper (used by KnowledgeBaseService)
- `minisearch` - Full-text search for log entries
- `vue-router` - Client-side routing
- `vue-i18n` - Internationalization (custom implementation in `i18n/index.ts`)
