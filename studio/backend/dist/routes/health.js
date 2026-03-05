"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// DevForge V2 — Health Check Routes
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const anthropic_js_1 = require("../lib/anthropic.js");
const ollama_js_1 = require("../lib/ollama.js");
const router = (0, express_1.Router)();
// GET /api/health - Overall system health
router.get('/', async (req, res) => {
    try {
        const [dbHealthy, anthropicHealthy, ollamaHealthy] = await Promise.all([
            checkDatabaseHealth(),
            (0, anthropic_js_1.checkAnthropicHealth)(),
            (0, ollama_js_1.checkOllamaHealth)(),
        ]);
        const status = dbHealthy && anthropicHealthy && ollamaHealthy ? 'healthy' : 'degraded';
        res.json({
            status,
            timestamp: new Date().toISOString(),
            services: {
                database: dbHealthy ? 'up' : 'down',
                anthropic: anthropicHealthy ? 'up' : 'down',
                ollama: ollamaHealthy ? 'up' : 'down',
            },
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/health/ollama
router.get('/ollama', async (req, res) => {
    try {
        const healthy = await (0, ollama_js_1.checkOllamaHealth)();
        res.json({
            status: healthy ? 'up' : 'down',
            url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/health/anthropic
router.get('/anthropic', async (req, res) => {
    try {
        const healthy = await (0, anthropic_js_1.checkAnthropicHealth)();
        res.json({
            status: healthy ? 'up' : 'down',
            configured: !!process.env.ANTHROPIC_API_KEY,
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// GET /api/health/db
router.get('/db', async (req, res) => {
    try {
        const healthy = await checkDatabaseHealth();
        res.json({
            status: healthy ? 'up' : 'down',
            type: 'sqlite',
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'down',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
async function checkDatabaseHealth() {
    try {
        await prisma_js_1.prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch {
        return false;
    }
}
exports.default = router;
