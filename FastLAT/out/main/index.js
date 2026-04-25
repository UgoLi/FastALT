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
const electron_1 = require("electron");
const path_1 = require("path");
const utils_1 = require("@electron-toolkit/utils");
const LogCleaningService_1 = require("./services/LogCleaningService");
const KnowledgeBaseService_1 = require("./services/KnowledgeBaseService");
const LLMService_1 = require("./services/LLMService");
const RAGService_1 = require("./services/RAGService");
const ReportService_1 = require("./services/ReportService");
const fs = __importStar(require("fs"));
// Services
const logCleaningService = new LogCleaningService_1.LogCleaningService();
const knowledgeBaseService = new KnowledgeBaseService_1.KnowledgeBaseService();
const llmService = new LLMService_1.LLMService();
const ragService = new RAGService_1.RAGService(llmService, knowledgeBaseService);
const reportService = new ReportService_1.ReportService();
// Data paths
const dataPath = (0, path_1.join)(electron_1.app.getPath('userData'), 'data');
const configPath = (0, path_1.join)(dataPath, 'config');
const kbPath = (0, path_1.join)(dataPath, 'knowledge-base');
const reportsPath = (0, path_1.join)(dataPath, 'reports');
const casesPath = (0, path_1.join)(dataPath, 'cases');
function ensureDataDirs() {
    const dirs = [dataPath, configPath, kbPath, reportsPath, casesPath];
    for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }
}
function createWindow() {
    const mainWindow = new electron_1.BrowserWindow({
        width: 1600,
        height: 1000,
        minWidth: 1400,
        minHeight: 900,
        show: false,
        autoHideMenuBar: true,
        title: 'FastLAT - Fast Log Analysis Tool v1.0.0',
        webPreferences: {
            preload: (0, path_1.join)(__dirname, '../preload/index.js'),
            sandbox: false
        }
    });
    mainWindow.on('ready-to-show', () => {
        mainWindow.show();
    });
    mainWindow.webContents.setWindowOpenHandler((details) => {
        electron_1.shell.openExternal(details.url);
        return { action: 'deny' };
    });
    if (utils_1.is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, '../renderer/index.html'));
    }
}
// Initialize services
async function initializeServices() {
    ensureDataDirs();
    await knowledgeBaseService.initialize(kbPath);
    await logCleaningService.loadRules((0, path_1.join)(configPath, 'cleaningRules.json'));
}
// IPC Handlers
function setupIpcHandlers() {
    // Log Cleaning
    electron_1.ipcMain.handle('logCleaning:importFiles', async (_, filePaths) => {
        return logCleaningService.importFiles(filePaths);
    });
    electron_1.ipcMain.handle('logCleaning:detectModule', async (_, filePath) => {
        return logCleaningService.detectModule(filePath);
    });
    electron_1.ipcMain.handle('logCleaning:cleanLogs', async (_, files) => {
        return logCleaningService.batchClean(files, knowledgeBaseService);
    });
    electron_1.ipcMain.handle('logCleaning:getModuleConfigs', async () => {
        return logCleaningService.getModuleConfigs();
    });
    electron_1.ipcMain.handle('logCleaning:getRules', async () => {
        return logCleaningService.getAllRules();
    });
    electron_1.ipcMain.handle('logCleaning:saveRule', async (_, rule) => {
        try {
            await logCleaningService.saveRule(rule, (0, path_1.join)(configPath, 'cleaningRules.json'));
            return { success: true };
        }
        catch (error) {
            console.error('Failed to save rule:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('logCleaning:deleteRule', async (_, ruleId) => {
        try {
            await logCleaningService.deleteRule(ruleId, (0, path_1.join)(configPath, 'cleaningRules.json'));
            return { success: true };
        }
        catch (error) {
            console.error('Failed to delete rule:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('logCleaning:exportRules', async () => {
        return logCleaningService.exportRules();
    });
    electron_1.ipcMain.handle('logCleaning:importRules', async (_, jsonContent) => {
        return logCleaningService.importRules(jsonContent, (0, path_1.join)(configPath, 'cleaningRules.json'));
    });
    electron_1.ipcMain.handle('logCleaning:getModuleNames', async () => {
        return logCleaningService.getModuleNames();
    });
    // Knowledge Base
    electron_1.ipcMain.handle('kb:getModules', async () => {
        return knowledgeBaseService.getModules();
    });
    electron_1.ipcMain.handle('kb:getEntries', async (_, moduleName, type, options) => {
        return knowledgeBaseService.getEntries(moduleName, type, options);
    });
    electron_1.ipcMain.handle('kb:searchEntries', async (_, query, moduleNames) => {
        return knowledgeBaseService.textSearch(query, moduleNames);
    });
    electron_1.ipcMain.handle('kb:addEntries', async (_, moduleName, type, entries) => {
        return knowledgeBaseService.addEntries(moduleName, type, entries);
    });
    electron_1.ipcMain.handle('kb:deleteEntries', async (_, moduleName, type, entryIds) => {
        return knowledgeBaseService.deleteEntries(moduleName, type, entryIds);
    });
    electron_1.ipcMain.handle('kb:exportKB', async (_, moduleName, type) => {
        return knowledgeBaseService.exportKB(moduleName, type);
    });
    electron_1.ipcMain.handle('kb:getStatistics', async (_, moduleName) => {
        return knowledgeBaseService.getStatistics(moduleName);
    });
    // Analysis
    electron_1.ipcMain.handle('analysis:analyze', async (_, question, moduleNames) => {
        return ragService.analyze(question, moduleNames);
    });
    electron_1.ipcMain.handle('analysis:getHistory', async () => {
        return ragService.getHistory();
    });
    // LLM Settings
    electron_1.ipcMain.handle('llm:getConfig', async () => {
        return llmService.getConfig();
    });
    electron_1.ipcMain.handle('llm:saveConfig', async (_, config) => {
        await llmService.saveConfig(config, (0, path_1.join)(dataPath, 'llm-config.json'));
        return true;
    });
    electron_1.ipcMain.handle('llm:healthCheck', async () => {
        return llmService.healthCheck();
    });
    // Report
    electron_1.ipcMain.handle('report:generate', async (_, analysisResult, options) => {
        return reportService.generateReport(analysisResult, options, reportsPath);
    });
    electron_1.ipcMain.handle('report:getReports', async () => {
        return reportService.getReports(reportsPath);
    });
    electron_1.ipcMain.handle('report:getReport', async (_, reportId) => {
        return reportService.getReport(reportId, reportsPath);
    });
    electron_1.ipcMain.handle('report:importToCaseKB', async (_, reportId, caseName) => {
        const report = await reportService.getReport(reportId, reportsPath);
        if (!report)
            throw new Error('Report not found');
        return reportService.importToCaseKB(report, caseName, casesPath, knowledgeBaseService);
    });
    // Utility
    electron_1.ipcMain.handle('util:selectFiles', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections'],
            filters: [
                { name: 'Log Files', extensions: ['log', 'txt'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        return result.filePaths;
    });
    electron_1.ipcMain.handle('util:selectDirectory', async () => {
        const result = await electron_1.dialog.showOpenDialog({
            properties: ['openDirectory']
        });
        return result.filePaths[0] || null;
    });
    electron_1.ipcMain.handle('util:showInFolder', async (_, path) => {
        electron_1.shell.showItemInFolder(path);
    });
    electron_1.ipcMain.handle('util:getAppVersion', async () => {
        return electron_1.app.getVersion();
    });
}
electron_1.app.whenReady().then(async () => {
    utils_1.electronApp.setAppUserModelId('com.fastlat.app');
    electron_1.app.on('browser-window-created', (_, window) => {
        utils_1.optimizer.watchWindowShortcuts(window);
    });
    await initializeServices();
    setupIpcHandlers();
    createWindow();
    electron_1.app.on('activate', function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
