"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeBaseService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
class KnowledgeBaseService {
    basePath = '';
    embeddingCache = new Map();
    minisearch = null;
    async initialize(basePath) {
        this.basePath = basePath;
        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath, { recursive: true });
        }
        // Initialize MiniSearch for text search (optional - fallback to simple search)
        try {
            const MiniSearch = (await Promise.resolve().then(() => __importStar(require('minisearch')))).default;
            this.minisearch = new MiniSearch({
                fields: ['cleanedContent', 'keywords'],
                storeFields: ['id', 'timestamp', 'cleanedContent', 'keywords', 'metadata']
            });
        }
        catch (e) {
            console.warn('MiniSearch not available, using simple text search');
        }
    }
    getKBPath(moduleName, type) {
        return path.join(this.basePath, moduleName, `${moduleName}_${type}.json`);
    }
    async loadKB(moduleName, type) {
        const kbPath = this.getKBPath(moduleName, type);
        try {
            if (fs.existsSync(kbPath)) {
                const content = fs.readFileSync(kbPath, 'utf-8');
                return JSON.parse(content);
            }
        }
        catch (error) {
            console.error('Failed to load KB:', error);
        }
        return this.createEmptyKB(moduleName, type);
    }
    async saveKB(moduleName, type, doc) {
        const kbPath = this.getKBPath(moduleName, type);
        const dir = path.dirname(kbPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        doc.updatedAt = new Date().toISOString();
        doc.statistics.totalEntries = doc.entries.length;
        fs.writeFileSync(kbPath, JSON.stringify(doc, null, 2));
    }
    createEmptyKB(moduleName, type) {
        return {
            version: '1.0',
            moduleName,
            type,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            entries: [],
            statistics: { totalEntries: 0 }
        };
    }
    async addEntries(moduleName, type, entries) {
        const doc = await this.loadKB(moduleName, type);
        // Add new entries
        for (const entry of entries) {
            if (!entry.id) {
                entry.id = (0, uuid_1.v4)();
            }
            doc.entries.push(entry);
        }
        // Update date range
        if (doc.entries.length > 0) {
            const timestamps = doc.entries.map(e => e.timestamp).filter(t => t);
            if (timestamps.length > 0) {
                doc.statistics.dateRange = {
                    from: timestamps.sort()[0],
                    to: timestamps.sort()[timestamps.length - 1]
                };
            }
        }
        // Update error code stats for Error KB
        if (type === 'Error') {
            const errorCodes = {};
            for (const entry of doc.entries) {
                if (entry.metadata.errorCode) {
                    errorCodes[entry.metadata.errorCode] = (errorCodes[entry.metadata.errorCode] || 0) + 1;
                }
            }
            doc.statistics.errorCodes = errorCodes;
        }
        await this.saveKB(moduleName, type, doc);
    }
    async getEntries(moduleName, type, options) {
        const doc = await this.loadKB(moduleName, type);
        const offset = options?.offset || 0;
        const limit = options?.limit || 1000;
        return doc.entries.slice(offset, offset + limit);
    }
    async textSearch(query, moduleNames) {
        const results = [];
        const modules = moduleNames || await this.getModules();
        for (const moduleName of modules) {
            for (const type of ['Normal', 'Error']) {
                const doc = await this.loadKB(moduleName, type);
                const queryLower = query.toLowerCase();
                for (const entry of doc.entries) {
                    // Simple text search
                    const contentMatch = entry.cleanedContent.toLowerCase().includes(queryLower);
                    const keywordMatch = entry.keywords.some(k => k.toLowerCase().includes(queryLower));
                    const errorCodeMatch = entry.metadata.errorCode?.toLowerCase().includes(queryLower);
                    if (contentMatch || keywordMatch || errorCodeMatch) {
                        results.push(entry);
                    }
                }
            }
        }
        return results.slice(0, 100);
    }
    async deleteEntries(moduleName, type, entryIds) {
        const doc = await this.loadKB(moduleName, type);
        doc.entries = doc.entries.filter(e => !entryIds.includes(e.id));
        await this.saveKB(moduleName, type, doc);
    }
    async exportKB(moduleName, type) {
        const doc = await this.loadKB(moduleName, type);
        return JSON.stringify(doc, null, 2);
    }
    async getStatistics(moduleName) {
        let totalNormal = 0;
        let totalError = 0;
        let dateRange;
        for (const type of ['Normal', 'Error']) {
            const doc = await this.loadKB(moduleName, type);
            if (type === 'Normal') {
                totalNormal = doc.statistics.totalEntries;
            }
            else {
                totalError = doc.statistics.totalEntries;
            }
            if (doc.statistics.dateRange) {
                if (!dateRange) {
                    dateRange = doc.statistics.dateRange;
                }
                else {
                    if (doc.statistics.dateRange.from < dateRange.from) {
                        dateRange.from = doc.statistics.dateRange.from;
                    }
                    if (doc.statistics.dateRange.to > dateRange.to) {
                        dateRange.to = doc.statistics.dateRange.to;
                    }
                }
            }
        }
        return { totalEntries: totalNormal + totalError, dateRange };
    }
    async getModules() {
        if (!fs.existsSync(this.basePath)) {
            return [];
        }
        const entries = fs.readdirSync(this.basePath, { withFileTypes: true });
        return entries
            .filter(e => e.isDirectory())
            .map(e => e.name);
    }
    async getAllEntriesForModule(moduleName) {
        const [normal, error] = await Promise.all([
            this.getEntries(moduleName, 'Normal'),
            this.getEntries(moduleName, 'Error')
        ]);
        return { normal, error };
    }
}
exports.KnowledgeBaseService = KnowledgeBaseService;
