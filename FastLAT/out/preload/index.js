"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const api = {
    // Log Cleaning
    logCleaning: {
        importFiles: (paths) => electron_1.ipcRenderer.invoke('logCleaning:importFiles', paths),
        detectModule: (filePath) => electron_1.ipcRenderer.invoke('logCleaning:detectModule', filePath),
        cleanLogs: (files) => electron_1.ipcRenderer.invoke('logCleaning:cleanLogs', files),
        getRules: () => electron_1.ipcRenderer.invoke('logCleaning:getRules'),
        saveRule: (rule) => electron_1.ipcRenderer.invoke('logCleaning:saveRule', rule),
        deleteRule: (ruleId) => electron_1.ipcRenderer.invoke('logCleaning:deleteRule', ruleId)
    },
    // Knowledge Base
    knowledgeBase: {
        getModules: () => electron_1.ipcRenderer.invoke('kb:getModules'),
        getEntries: (moduleName, type, options) => electron_1.ipcRenderer.invoke('kb:getEntries', moduleName, type, options),
        searchEntries: (query, moduleNames) => electron_1.ipcRenderer.invoke('kb:searchEntries', query, moduleNames),
        addEntries: (moduleName, type, entries) => electron_1.ipcRenderer.invoke('kb:addEntries', moduleName, type, entries),
        deleteEntries: (moduleName, type, entryIds) => electron_1.ipcRenderer.invoke('kb:deleteEntries', moduleName, type, entryIds),
        exportKB: (moduleName, type) => electron_1.ipcRenderer.invoke('kb:exportKB', moduleName, type),
        getStatistics: (moduleName) => electron_1.ipcRenderer.invoke('kb:getStatistics', moduleName)
    },
    // Analysis
    analysis: {
        analyze: (question, moduleNames) => electron_1.ipcRenderer.invoke('analysis:analyze', question, moduleNames),
        getHistory: () => electron_1.ipcRenderer.invoke('analysis:getHistory')
    },
    // LLM Settings
    llm: {
        getConfig: () => electron_1.ipcRenderer.invoke('llm:getConfig'),
        saveConfig: (config) => electron_1.ipcRenderer.invoke('llm:saveConfig', config),
        healthCheck: () => electron_1.ipcRenderer.invoke('llm:healthCheck')
    },
    // Report
    report: {
        generate: (analysisResult, options) => electron_1.ipcRenderer.invoke('report:generate', analysisResult, options),
        getReports: () => electron_1.ipcRenderer.invoke('report:getReports'),
        getReport: (reportId) => electron_1.ipcRenderer.invoke('report:getReport', reportId),
        importToCaseKB: (reportId, caseName) => electron_1.ipcRenderer.invoke('report:importToCaseKB', reportId, caseName)
    },
    // Utility
    util: {
        selectFiles: () => electron_1.ipcRenderer.invoke('util:selectFiles'),
        selectDirectory: () => electron_1.ipcRenderer.invoke('util:selectDirectory'),
        showInFolder: (path) => electron_1.ipcRenderer.invoke('util:showInFolder', path),
        getAppVersion: () => electron_1.ipcRenderer.invoke('util:getAppVersion')
    }
};
electron_1.contextBridge.exposeInMainWorld('api', api);
