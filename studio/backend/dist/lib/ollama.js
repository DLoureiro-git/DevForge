// DevForge V2 — Ollama Client
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const TIMEOUT_MS = 10000;
export class OllamaClient {
    baseUrl;
    timeout;
    constructor(baseUrl = OLLAMA_BASE_URL, timeout = TIMEOUT_MS) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }
    /**
     * Check if Ollama is running and accessible
     */
    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                return false;
            }
            const data = (await response.json());
            return Array.isArray(data.models);
        }
        catch (error) {
            console.error('[Ollama] Health check failed:', error);
            return false;
        }
    }
    /**
     * List all available models
     */
    async listModels() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.statusText}`);
            }
            const data = (await response.json());
            return data.models.map((m) => m.name);
        }
        catch (error) {
            console.error('[Ollama] Failed to list models:', error);
            throw error;
        }
    }
    /**
     * Get detailed information about available models
     */
    async getModelsInfo() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            const response = await fetch(`${this.baseUrl}/api/tags`, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Failed to get models info: ${response.statusText}`);
            }
            const data = (await response.json());
            return data.models;
        }
        catch (error) {
            console.error('[Ollama] Failed to get models info:', error);
            throw error;
        }
    }
    /**
     * Test connection with a quick generation
     */
    async testConnection(model = 'qwen2.5:14b') {
        try {
            const startTime = Date.now();
            const response = await this.generate(model, 'Say "OK" if you can read this.', 'You are a test assistant. Respond with exactly "OK" and nothing else.', { temperature: 0, num_predict: 5 });
            const duration = Date.now() - startTime;
            return {
                success: true,
                duration,
                response: response.trim(),
            };
        }
        catch (error) {
            return {
                success: false,
                duration: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async generate(model, prompt, systemPrompt, options) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5min timeout for generation
            const body = {
                model,
                prompt,
                system: systemPrompt,
                stream: false,
                options,
            };
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`Generation failed: ${response.statusText}`);
            }
            const data = (await response.json());
            return data.response;
        }
        catch (error) {
            console.error('[Ollama] Generation failed:', error);
            throw error;
        }
    }
    /**
     * Remover markdown code blocks (```) do output
     */
    removeMarkdownCodeBlocks(text) {
        // Se começa com ``` e termina com ```, remover
        if (text.startsWith('```') && text.endsWith('```')) {
            const lines = text.split('\n');
            // Remover primeira linha (```language) e última (```)
            return lines.slice(1, -1).join('\n');
        }
        // Se tem apenas no início
        if (text.startsWith('```')) {
            const lines = text.split('\n');
            return lines.slice(1).join('\n');
        }
        // Se tem apenas no fim
        if (text.endsWith('```')) {
            const lines = text.split('\n');
            return lines.slice(0, -1).join('\n');
        }
        return text;
    }
}
export const ollama = new OllamaClient();
export async function checkOllamaHealth() {
    return ollama.checkHealth();
}
