"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// DevForge V2 — Ollama Routes
const express_1 = require("express");
const ollama_js_1 = require("../lib/ollama.js");
const router = (0, express_1.Router)();
// GET /api/ollama/status - Check installation and running status
router.get('/status', async (req, res) => {
    try {
        const running = await ollama_js_1.ollama.checkHealth();
        let models = [];
        if (running) {
            try {
                models = await ollama_js_1.ollama.listModels();
            }
            catch (error) {
                console.error('[Ollama] Failed to list models:', error);
            }
        }
        res.json({
            installed: true, // Se chegou aqui, está instalado
            running,
            models,
            url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        });
    }
    catch (error) {
        res.status(503).json({
            installed: false,
            running: false,
            models: [],
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/ollama/models - List available models
router.get('/models', async (req, res) => {
    try {
        const models = await ollama_js_1.ollama.listModels();
        res.json({ models });
    }
    catch (error) {
        res.status(503).json({
            models: [],
            error: error instanceof Error ? error.message : 'Ollama not available',
        });
    }
});
// POST /api/ollama/test - Test connection with quick generation
router.post('/test', async (req, res) => {
    try {
        const { model = 'qwen2.5:14b' } = req.body;
        const startTime = Date.now();
        const response = await ollama_js_1.ollama.generate(model, 'Say "OK" if you can read this.', 'You are a test assistant. Respond with exactly "OK" and nothing else.', { temperature: 0, num_predict: 5 });
        const duration = Date.now() - startTime;
        res.json({
            success: true,
            model,
            response: response.trim(),
            duration,
            url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            error: error instanceof Error ? error.message : 'Test failed',
        });
    }
});
exports.default = router;
