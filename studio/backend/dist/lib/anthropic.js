"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.anthropic = void 0;
exports.createAnthropicClient = createAnthropicClient;
exports.checkAnthropicHealth = checkAnthropicHealth;
exports.withRetry = withRetry;
// DevForge V2 — Anthropic Client Singleton
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const globalForAnthropic = globalThis;
exports.anthropic = globalForAnthropic.anthropic ??
    new sdk_1.default({
        apiKey: process.env.ANTHROPIC_API_KEY,
        maxRetries: 3,
    });
if (process.env.NODE_ENV !== 'production')
    globalForAnthropic.anthropic = exports.anthropic;
/**
 * Cria um cliente Anthropic com a API Key do utilizador
 * @param userApiKey - API Key fornecida pelo utilizador
 */
function createAnthropicClient(userApiKey) {
    return new sdk_1.default({
        apiKey: userApiKey,
        maxRetries: 3,
    });
}
async function checkAnthropicHealth() {
    if (!process.env.ANTHROPIC_API_KEY) {
        return false;
    }
    try {
        // Test API key with minimal request
        await exports.anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }],
        });
        return true;
    }
    catch (error) {
        console.error('[Anthropic] Health check failed:', error);
        return false;
    }
}
async function withRetry(fn, options = {}) {
    const { maxRetries = 3, delayMs = 1000 } = options;
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
            }
        }
    }
    throw lastError;
}
