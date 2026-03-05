// DevForge V2 — Anthropic Client Singleton
import Anthropic from '@anthropic-ai/sdk';
const globalForAnthropic = globalThis;
export const anthropic = globalForAnthropic.anthropic ??
    new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        maxRetries: 3,
    });
if (process.env.NODE_ENV !== 'production')
    globalForAnthropic.anthropic = anthropic;
export async function checkAnthropicHealth() {
    if (!process.env.ANTHROPIC_API_KEY) {
        return false;
    }
    try {
        // Test API key with minimal request
        await anthropic.messages.create({
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
export async function withRetry(fn, options = {}) {
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
