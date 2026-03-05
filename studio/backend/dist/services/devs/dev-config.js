"use strict";
/**
 * DEV TEAM CONFIGURATION
 *
 * Configuração centralizada para todos os developers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEV_CONFIG = void 0;
exports.getModelForDev = getModelForDev;
exports.getOllamaOptions = getOllamaOptions;
exports.devLog = devLog;
exports.DEV_CONFIG = {
    // Modelo Ollama padrão
    defaultModel: process.env.OLLAMA_DEV_MODEL || 'qwen2.5-coder:32b',
    // Timeout para geração (ms)
    timeout: parseInt(process.env.OLLAMA_DEV_TIMEOUT || '300000'), // 5 min
    // Temperature (0-1, menor = mais determinístico)
    temperature: parseFloat(process.env.OLLAMA_DEV_TEMPERATURE || '0.2'),
    // Top P (nucleus sampling)
    topP: parseFloat(process.env.OLLAMA_DEV_TOP_P || '0.9'),
    // Retries em caso de erro
    maxRetries: parseInt(process.env.OLLAMA_DEV_RETRIES || '2'),
    // Logging
    verbose: process.env.OLLAMA_DEV_VERBOSE === 'true',
    // Modelos alternativos por dev (override)
    devModels: {
        frontend: process.env.OLLAMA_FRONTEND_MODEL || undefined,
        backend: process.env.OLLAMA_BACKEND_MODEL || undefined,
        database: process.env.OLLAMA_DATABASE_MODEL || undefined,
        utils: process.env.OLLAMA_UTILS_MODEL || undefined
    }
};
/**
 * Obter modelo para um dev específico
 */
function getModelForDev(devRole) {
    return exports.DEV_CONFIG.devModels[devRole] || exports.DEV_CONFIG.defaultModel;
}
/**
 * Obter configuração Ollama options
 */
function getOllamaOptions() {
    return {
        temperature: exports.DEV_CONFIG.temperature,
        top_p: exports.DEV_CONFIG.topP
    };
}
/**
 * Log se verbose mode activo
 */
function devLog(message, data) {
    if (exports.DEV_CONFIG.verbose) {
        console.log(`[DevTeam] ${message}`, data || '');
    }
}
