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
exports.ReportService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
class ReportService {
    getTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FastLAT Analysis Report - {{timestamp}}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 40px;
    }
    .container {
      max-width: 1000px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 32px 40px;
    }
    .header h1 {
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .header .meta {
      font-size: 14px;
      opacity: 0.9;
    }
    .header .meta span {
      margin-right: 24px;
    }
    .content {
      padding: 40px;
    }
    .section {
      margin-bottom: 32px;
    }
    .section h2 {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    .summary-box {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      font-size: 15px;
    }
    .issues-list {
      list-style: none;
    }
    .issue-item {
      background: white;
      border-left: 4px solid #ef4444;
      padding: 16px 20px;
      margin-bottom: 12px;
      border-radius: 0 8px 8px 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    .issue-item.medium { border-color: #f59e0b; }
    .issue-item.low { border-color: #22c55e; }
    .issue-item h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .issue-item .timestamp {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .issue-item .error-code {
      display: inline-block;
      background: #fee2e2;
      color: #991b1b;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .recommendations-list {
      list-style: none;
    }
    .recommendation-item {
      background: #eff6ff;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 8px;
      border-left: 4px solid #2563eb;
    }
    .error-detail {
      background: #fef2f2;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .error-detail .error-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .error-detail .error-code {
      background: #fee2e2;
      color: #991b1b;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 13px;
    }
    .error-detail .timestamp {
      color: #6b7280;
      font-size: 13px;
    }
    .metadata {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      font-size: 13px;
      color: #6b7280;
    }
    .metadata p { margin-bottom: 4px; }
    .footer {
      text-align: center;
      padding: 20px;
      color: #9ca3af;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .header { background: #1f2937 !important; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FastLAT Log Analysis Report</h1>
      <div class="meta">
        <span>Generated: {{generatedAt}}</span>
        <span>Modules: {{moduleNames}}</span>
      </div>
      <div class="meta" style="margin-top: 8px;">
        <span>Question: {{question}}</span>
      </div>
    </div>

    <div class="content">
      <div class="section">
        <h2>Summary</h2>
        <div class="summary-box">{{summary}}</div>
      </div>

      {{#if keyIssues.length}}
      <div class="section">
        <h2>Key Issues ({{keyIssues.length}})</h2>
        <ul class="issues-list">
          {{#each keyIssues}}
          <li class="issue-item {{severity}}">
            <h3>{{this}}</h3>
          </li>
          {{/each}}
        </ul>
      </div>
      {{/if}}

      {{#if errorDetails.length}}
      <div class="section">
        <h2>Error Details</h2>
        {{#each errorDetails}}
        <div class="error-detail">
          <div class="error-header">
            {{#if errorCode}}<span class="error-code">{{errorCode}}</span>{{/if}}
            <span class="timestamp">{{timestamp}}</span>
          </div>
          <p>{{description}}</p>
          {{#if suggestedAction}}
          <p style="margin-top: 8px; color: #2563eb;"><strong>Suggested Action:</strong> {{suggestedAction}}</p>
          {{/if}}
        </div>
        {{/each}}
      </div>
      {{/if}}

      {{#if recommendations.length}}
      <div class="section">
        <h2>Recommendations</h2>
        <ul class="recommendations-list">
          {{#each recommendations}}
          <li class="recommendation-item">{{this}}</li>
          {{/each}}
        </ul>
      </div>
      {{/if}}

      <div class="section">
        <h2>Analysis Metadata</h2>
        <div class="metadata">
          <p><strong>Context Entries Used:</strong> {{contextCount}}</p>
          <p><strong>Processing Time:</strong> {{processingTime}}ms</p>
          <p><strong>Analysis Status:</strong> {{#if success}}Successful{{else}}Failed{{/if}}</p>
        </div>
      </div>
    </div>

    <div class="footer">
      Generated by FastLAT - Fast Log Analysis Tool
    </div>
  </div>
</body>
</html>`;
    }
    async generateReport(analysisResult, options = {}, reportsPath) {
        const id = (0, uuid_1.v4)();
        const now = new Date().toISOString();
        // Build template data
        const templateData = {
            timestamp: now,
            generatedAt: new Date(now).toLocaleString(),
            moduleNames: analysisResult.relatedModules?.join(', ') || 'Unknown',
            question: options.title || 'Log Analysis',
            summary: analysisResult.summary,
            keyIssues: analysisResult.keyIssues,
            errorDetails: analysisResult.errorDetails,
            recommendations: analysisResult.recommendations,
            contextCount: analysisResult.contextCount,
            processingTime: analysisResult.processingTime,
            success: analysisResult.success
        };
        // Generate HTML
        let htmlContent = this.getTemplate();
        htmlContent = htmlContent.replace(/\{\{timestamp\}\}/g, now);
        htmlContent = htmlContent.replace(/\{\{generatedAt\}\}/g, templateData.generatedAt);
        htmlContent = htmlContent.replace(/\{\{moduleNames\}\}/g, templateData.moduleNames);
        htmlContent = htmlContent.replace(/\{\{question\}\}/g, templateData.question);
        htmlContent = htmlContent.replace('{{summary}}', templateData.summary);
        htmlContent = htmlContent.replace('{{contextCount}}', String(templateData.contextCount));
        htmlContent = htmlContent.replace('{{processingTime}}', String(templateData.processingTime));
        htmlContent = htmlContent.replace('{{#if success}}Successful{{else}}Failed{{/if}}', analysisResult.success ? 'Successful' : 'Failed');
        // Replace each blocks
        htmlContent = this.replaceEachBlock(htmlContent, 'keyIssues', templateData.keyIssues, (item) => `<li class="issue-item"><h3>${item}</h3></li>`);
        htmlContent = this.replaceEachBlock(htmlContent, 'errorDetails', templateData.errorDetails, (item) => {
            return `<div class="error-detail">
        <div class="error-header">
          ${item.errorCode ? `<span class="error-code">${item.errorCode}</span>` : ''}
          <span class="timestamp">${item.timestamp}</span>
        </div>
        <p>${item.description}</p>
        ${item.suggestedAction ? `<p style="margin-top: 8px; color: #2563eb;"><strong>Suggested Action:</strong> ${item.suggestedAction}</p>` : ''}
      </div>`;
        });
        htmlContent = this.replaceEachBlock(htmlContent, 'recommendations', templateData.recommendations, (item) => `<li class="recommendation-item">${item}</li>`);
        const report = {
            id,
            title: options.title || `Analysis Report - ${new Date().toLocaleDateString()}`,
            generatedAt: now,
            analysisResult,
            moduleNames: analysisResult.relatedModules || [],
            question: templateData.question,
            htmlContent
        };
        // Save report
        if (!fs.existsSync(reportsPath)) {
            fs.mkdirSync(reportsPath, { recursive: true });
        }
        fs.writeFileSync(path.join(reportsPath, `${id}.json`), JSON.stringify(report, null, 2));
        return report;
    }
    replaceEachBlock(html, blockName, items, itemTemplate) {
        const startMarker = `{{#each ${blockName}}}`;
        const endMarker = `{{/each ${blockName}}}`;
        const startIdx = html.indexOf(startMarker);
        const endIdx = html.indexOf(endMarker);
        if (startIdx === -1 || endIdx === -1) {
            // Remove any remaining markers
            return html.replace(new RegExp(`{{#each ${blockName}}}`, 'g'), '')
                .replace(new RegExp(`{{/each ${blockName}}}`, 'g'), '');
        }
        const before = html.substring(0, startIdx);
        const after = html.substring(endIdx + endMarker.length);
        const itemsHtml = items.map(itemTemplate).join('');
        return before + itemsHtml + after;
    }
    async getReports(reportsPath) {
        if (!fs.existsSync(reportsPath)) {
            return [];
        }
        const files = fs.readdirSync(reportsPath).filter(f => f.endsWith('.json'));
        const reports = [];
        for (const file of files) {
            try {
                const content = fs.readFileSync(path.join(reportsPath, file), 'utf-8');
                const report = JSON.parse(content);
                // Don't load full htmlContent for list view
                reports.push({
                    ...report,
                    htmlContent: '' // Will be loaded on demand
                });
            }
            catch { }
        }
        return reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    }
    async getReport(reportId, reportsPath) {
        const reportPath = path.join(reportsPath, `${reportId}.json`);
        if (!fs.existsSync(reportPath)) {
            return null;
        }
        try {
            const content = fs.readFileSync(reportPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    async importToCaseKB(report, caseName, casesPath, kbService) {
        // Create case-specific KB entries from report
        const entries = [];
        for (const issue of report.analysisResult.keyIssues) {
            entries.push({
                id: (0, uuid_1.v4)(),
                timestamp: report.generatedAt,
                rawContent: issue,
                cleanedContent: issue,
                keywords: this.extractKeywords(issue),
                metadata: {
                    moduleName: caseName,
                    type: 'Error',
                    sourceFile: `report:${report.id}`,
                    lineNumber: 0
                }
            });
        }
        for (const rec of report.analysisResult.recommendations) {
            entries.push({
                id: (0, uuid_1.v4)(),
                timestamp: report.generatedAt,
                rawContent: rec,
                cleanedContent: rec,
                keywords: this.extractKeywords(rec),
                metadata: {
                    moduleName: caseName,
                    type: 'Normal',
                    sourceFile: `report:${report.id}`,
                    lineNumber: 0
                }
            });
        }
        if (entries.length > 0) {
            await kbService.addEntries(caseName, 'Normal', entries);
        }
    }
    extractKeywords(content) {
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 3);
        return [...new Set(words)].slice(0, 10);
    }
}
exports.ReportService = ReportService;
