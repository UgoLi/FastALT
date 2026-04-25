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
exports.LLMService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LLMService {
    config = null;
    async initialize(configPath) {
        try {
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf-8');
                this.config = JSON.parse(content);
            }
        }
        catch (error) {
            console.error('Failed to load LLM config:', error);
        }
    }
    async saveConfig(config, configPath) {
        this.config = config;
        const dir = path.dirname(configPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
    getConfig() {
        return this.config;
    }
    async healthCheck() {
        if (!this.config) {
            return { ok: false, error: 'LLM not configured' };
        }
        const startTime = Date.now();
        try {
            if (this.config.provider === 'ollama') {
                const baseURL = this.config.baseURL || 'http://localhost:11434';
                const response = await fetch(`${baseURL}/api/tags`, {
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                if (response.ok) {
                    return { ok: true, latency: Date.now() - startTime };
                }
                else {
                    return { ok: false, error: `HTTP ${response.status}` };
                }
            }
            else if (this.config.provider === 'openai' || this.config.provider === 'anthropic') {
                // For cloud providers, just check if configured
                if (!this.config.apiKey) {
                    return { ok: false, error: 'API key not configured' };
                }
                return { ok: true, latency: Date.now() - startTime };
            }
            return { ok: false, error: 'Unknown provider' };
        }
        catch (error) {
            return { ok: false, error: error.message || 'Connection failed' };
        }
    }
    async chat(messages) {
        if (!this.config) {
            throw new Error('LLM not configured');
        }
        if (this.config.provider === 'ollama') {
            return this.chatWithOllama(messages);
        }
        else if (this.config.provider === 'openai') {
            return this.chatWithOpenAI(messages);
        }
        else if (this.config.provider === 'anthropic') {
            return this.chatWithAnthropic(messages);
        }
        throw new Error('Unsupported provider');
    }
    async chatWithOllama(messages) {
        const baseURL = this.config.baseURL || 'http://localhost:11434';
        const response = await fetch(`${baseURL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                })),
                stream: false
            })
        });
        if (!response.ok) {
            throw new Error(`Ollama error: ${response.status}`);
        }
        const data = await response.json();
        return data.message?.content || '';
    }
    async chatWithOpenAI(messages) {
        const baseURL = this.config.baseURL || 'https://api.openai.com/v1';
        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            })
        });
        if (!response.ok) {
            throw new Error(`OpenAI error: ${response.status}`);
        }
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }
    async chatWithAnthropic(messages) {
        const baseURL = this.config.baseURL || 'https://api.anthropic.com/v1';
        // Convert messages format for Anthropic
        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');
        const response = await fetch(`${baseURL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.config.apiKey || '',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model,
                max_tokens: 4096,
                system: systemMessage?.content,
                messages: chatMessages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                }))
            })
        });
        if (!response.ok) {
            throw new Error(`Anthropic error: ${response.status}`);
        }
        const data = await response.json();
        return data.content?.[0]?.text || '';
    }
    async generateEmbedding(content) {
        if (!this.config) {
            // Return dummy embedding if not configured
            return this.generateDummyEmbedding(content);
        }
        if (this.config.provider === 'ollama') {
            return this.generateEmbeddingOllama(content);
        }
        // Fallback to dummy embedding
        return this.generateDummyEmbedding(content);
    }
    async generateEmbeddingOllama(content) {
        const baseURL = this.config.baseURL || 'http://localhost:11434';
        const model = this.config.embeddingModel || 'nomic-embed-text';
        try {
            const response = await fetch(`${baseURL}/api/embeddings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, prompt: content })
            });
            if (response.ok) {
                const data = await response.json();
                return data.embedding || [];
            }
        }
        catch { }
        return this.generateDummyEmbedding(content);
    }
    generateDummyEmbedding(content) {
        // Generate a simple hash-based embedding for demo purposes
        const embedding = new Array(384).fill(0);
        for (let i = 0; i < content.length; i++) {
            embedding[i % 384] += content.charCodeAt(i);
        }
        // Normalize
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
    }
    parseAnalysisResponse(content) {
        try {
            // Try to parse as JSON
            return JSON.parse(content);
        }
        catch {
            // Parse as text with sections
            return this.parseTextResponse(content);
        }
    }
    parseTextResponse(content) {
        const result = {
            summary: '',
            keyIssues: [],
            errorDetails: [],
            recommendations: []
        };
        const lines = content.split('\n');
        let currentSection = 'summary';
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('## Summary') || trimmed.startsWith('Summary:')) {
                currentSection = 'summary';
            }
            else if (trimmed.startsWith('## Issues') || trimmed.startsWith('Issues:') || trimmed.startsWith('- ')) {
                currentSection = 'issues';
            }
            else if (trimmed.startsWith('## Recommendations') || trimmed.startsWith('Recommendations:')) {
                currentSection = 'recommendations';
            }
            else if (trimmed && currentSection === 'summary') {
                result.summary += (result.summary ? ' ' : '') + trimmed;
            }
            else if (trimmed.startsWith('- ') && currentSection === 'issues') {
                result.keyIssues?.push(trimmed.substring(2));
            }
            else if (trimmed.startsWith('- ') && currentSection === 'recommendations') {
                result.recommendations?.push(trimmed.substring(2));
            }
        }
        if (!result.summary) {
            result.summary = content.substring(0, 500);
        }
        return result;
    }
}
exports.LLMService = LLMService;
