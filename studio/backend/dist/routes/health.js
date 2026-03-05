// DevForge V2 — Health Check Routes
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { checkAnthropicHealth } from '../lib/anthropic.js';
import { checkOllamaHealth } from '../lib/ollama.js';
const router = Router();
// GET /api/health - Overall system health
router.get('/', async (req, res) => {
    try {
        const [dbHealthy, anthropicHealthy, ollamaHealthy] = await Promise.all([
            checkDatabaseHealth(),
            checkAnthropicHealth(),
            checkOllamaHealth(),
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
        const healthy = await checkOllamaHealth();
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
        const healthy = await checkAnthropicHealth();
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
        await prisma.$queryRaw `SELECT 1`;
        return true;
    }
    catch {
        return false;
    }
}
export default router;
