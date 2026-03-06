"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// DevForge V2 — Projects Routes
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const error_js_1 = require("../middleware/error.js");
const auth_js_1 = require("../middleware/auth.js");
const sse_js_1 = require("../lib/sse.js");
const archiver_1 = __importDefault(require("archiver"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const pm_agent_js_1 = require("../services/pm-agent.js");
const orchestrator_js_1 = require("../services/orchestrator.js");
const router = (0, express_1.Router)();
// Helper to ensure param is string
function getParamId(param) {
    return Array.isArray(param) ? param[0] : param;
}
// POST /api/projects - Create new project and start intake
router.post('/', auth_js_1.extractUser, async (req, res, next) => {
    try {
        const { name, description } = req.body;
        if (!name) {
            throw new error_js_1.AppError('Project name is required', 400);
        }
        // Se não houver user, criar/usar demo user
        let userId = req.user?.id;
        if (!userId) {
            const demoUser = await prisma_js_1.prisma.user.upsert({
                where: { email: 'demo@devforge.local' },
                update: {},
                create: {
                    email: 'demo@devforge.local',
                    name: 'Demo User',
                    plan: 'FREE',
                },
            });
            userId = demoUser.id;
        }
        const project = await prisma_js_1.prisma.project.create({
            data: {
                userId,
                name,
                description,
                status: 'INTAKE',
            },
            include: {
                phases: true,
                messages: true,
            },
        });
        // Create initial PM phase
        await prisma_js_1.prisma.phase.create({
            data: {
                projectId: project.id,
                type: 'PM',
                status: 'PENDING',
            },
        });
        // TODO: Trigger PM Agent intake process
        res.status(201).json(project);
    }
    catch (error) {
        next(error);
    }
});
// GET /api/projects - List user's projects
router.get('/', auth_js_1.extractUser, async (req, res, next) => {
    try {
        // Se não houver user, listar todos os projectos (demo mode)
        const whereClause = req.user?.id ? { userId: req.user.id } : {};
        const projects = await prisma_js_1.prisma.project.findMany({
            where: whereClause,
            include: {
                phases: {
                    orderBy: { startedAt: 'asc' },
                },
                _count: {
                    select: {
                        bugs: true,
                        messages: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(projects);
    }
    catch (error) {
        next(error);
    }
});
// GET /api/projects/:id - Get project details
router.get('/:id', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const project = await prisma_js_1.prisma.project.findFirst({
            where: {
                id: getParamId(req.params.id),
                userId: req.user.id,
            },
            include: {
                phases: {
                    include: {
                        logs: {
                            orderBy: { timestamp: 'asc' },
                        },
                    },
                    orderBy: { startedAt: 'asc' },
                },
                bugs: {
                    orderBy: { createdAt: 'desc' },
                },
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!project) {
            throw new error_js_1.AppError('Project not found', 404);
        }
        res.json(project);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/chat - Send message to PM Agent
router.post('/:id/chat', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content) {
            throw new error_js_1.AppError('Message content is required', 400);
        }
        const project = await prisma_js_1.prisma.project.findFirst({
            where: {
                id: getParamId(req.params.id),
                userId: req.user.id,
            },
        });
        if (!project) {
            throw new error_js_1.AppError('Project not found', 404);
        }
        // Save user message
        const userMessage = await prisma_js_1.prisma.message.create({
            data: {
                projectId: project.id,
                role: 'USER',
                content,
            },
        });
        // Get user's Anthropic API Key from Settings
        const settings = await prisma_js_1.prisma.settings.findUnique({
            where: { userId: req.user.id },
        });
        const userApiKey = settings?.anthropicKey;
        if (!userApiKey) {
            throw new error_js_1.AppError('API Key not configured. Please add your Anthropic API Key in Settings.', 400);
        }
        // Get all messages for context
        const allMessages = await prisma_js_1.prisma.message.findMany({
            where: { projectId: project.id },
            orderBy: { createdAt: 'asc' },
        });
        // Send to PM Agent
        const pmAgent = new pm_agent_js_1.PMAgent(userApiKey);
        const pmResponse = await pmAgent.processMessage(content, allMessages);
        // Save agent response
        const agentMessage = await prisma_js_1.prisma.message.create({
            data: {
                projectId: project.id,
                role: 'AGENT',
                content: pmResponse.agentResponse,
            },
        });
        // If intake complete, save PRD
        if (pmResponse.isComplete && pmResponse.prd) {
            await prisma_js_1.prisma.project.update({
                where: { id: project.id },
                data: {
                    prd: pmResponse.prd,
                    status: 'PLANNING',
                    estimatedMin: pmResponse.prd.estimatedMinutes,
                },
            });
        }
        res.json({
            userMessage,
            agentMessage,
            isComplete: pmResponse.isComplete,
            prd: pmResponse.prd,
            quickReplies: pmResponse.nextQuestion?.quickReplies,
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/confirm - Confirm PRD and start build
router.post('/:id/confirm', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const project = await prisma_js_1.prisma.project.findFirst({
            where: {
                id: getParamId(req.params.id),
                userId: req.user.id,
            },
        });
        if (!project) {
            throw new error_js_1.AppError('Project not found', 404);
        }
        if (project.status !== 'INTAKE' && project.status !== 'PLANNING') {
            throw new error_js_1.AppError('Project cannot be confirmed in current status', 400);
        }
        if (!project.prd) {
            throw new error_js_1.AppError('PRD not generated yet', 400);
        }
        // Update project status
        const updated = await prisma_js_1.prisma.project.update({
            where: { id: project.id },
            data: { status: 'BUILDING' },
        });
        // Get user settings for API Key and Ollama config
        const settings = await prisma_js_1.prisma.settings.findUnique({
            where: { userId: req.user.id },
        });
        // Trigger build pipeline
        const pipeline = new orchestrator_js_1.Pipeline({
            projectId: project.id,
            claudeApiKey: settings?.anthropicKey,
            ollamaEndpoint: settings?.ollamaUrl,
            ollamaModel: settings?.ollamaModelDev,
            outputDirectory: settings?.outputDirectory,
        });
        // Execute pipeline in background
        pipeline.run().catch(async (error) => {
            console.error(`[Pipeline] Error for project ${project.id}:`, error);
            // Verificar se projeto ainda existe antes de actualizar
            const exists = await prisma_js_1.prisma.project.findUnique({
                where: { id: project.id },
            });
            if (exists) {
                await prisma_js_1.prisma.project.update({
                    where: { id: project.id },
                    data: { status: 'FAILED' },
                });
            }
            sse_js_1.sseManager.send(project.id, {
                type: 'error',
                error: error.message,
            });
        });
        sse_js_1.sseManager.send(project.id, {
            type: 'status',
            status: 'BUILDING',
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/pause - Pause project
router.post('/:id/pause', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const project = await prisma_js_1.prisma.project.findFirst({
            where: {
                id: getParamId(req.params.id),
                userId: req.user.id,
            },
        });
        if (!project) {
            throw new error_js_1.AppError('Project not found', 404);
        }
        const updated = await prisma_js_1.prisma.project.update({
            where: { id: project.id },
            data: { status: 'PAUSED' },
        });
        // TODO: Pause build pipeline
        sse_js_1.sseManager.send(project.id, {
            type: 'status',
            status: 'PAUSED',
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/resume - Resume paused project
router.post('/:id/resume', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const project = await prisma_js_1.prisma.project.findFirst({
            where: {
                id: getParamId(req.params.id),
                userId: req.user.id,
            },
        });
        if (!project) {
            throw new error_js_1.AppError('Project not found', 404);
        }
        if (project.status !== 'PAUSED') {
            throw new error_js_1.AppError('Project is not paused', 400);
        }
        // Determine next status based on last phase
        const lastPhase = await prisma_js_1.prisma.phase.findFirst({
            where: { projectId: project.id },
            orderBy: { startedAt: 'desc' },
        });
        let nextStatus = 'BUILDING';
        if (lastPhase?.type === 'QA') {
            nextStatus = 'QA';
        }
        else if (lastPhase?.type === 'BUGFIX') {
            nextStatus = 'FIXING';
        }
        const updated = await prisma_js_1.prisma.project.update({
            where: { id: project.id },
            data: { status: nextStatus },
        });
        // TODO: Resume build pipeline
        sse_js_1.sseManager.send(project.id, {
            type: 'status',
            status: nextStatus,
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
// GET /api/projects/:id/stream - SSE logs stream
router.get('/:id/stream', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const project = await prisma_js_1.prisma.project.findFirst({
            where: {
                id: getParamId(req.params.id),
                userId: req.user.id,
            },
        });
        if (!project) {
            throw new error_js_1.AppError('Project not found', 404);
        }
        sse_js_1.sseManager.addConnection(project.id, res);
    }
    catch (error) {
        next(error);
    }
});
// GET /api/projects/:id/download - Download project ZIP
router.get('/:id/download', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const project = await prisma_js_1.prisma.project.findFirst({
            where: {
                id: getParamId(req.params.id),
                userId: req.user.id,
            },
        });
        if (!project) {
            throw new error_js_1.AppError('Project not found', 404);
        }
        if (!project.outputPath) {
            throw new error_js_1.AppError('Project has not been built yet', 400);
        }
        const projectPath = path_1.default.resolve(project.outputPath);
        if (!(0, fs_1.existsSync)(projectPath)) {
            throw new error_js_1.AppError('Project files not found', 404);
        }
        if (!(0, fs_1.statSync)(projectPath).isDirectory()) {
            throw new error_js_1.AppError('Invalid project path', 400);
        }
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${project.name}.zip"`);
        const archive = (0, archiver_1.default)('zip', {
            zlib: { level: 9 },
        });
        archive.on('error', (err) => {
            throw err;
        });
        archive.pipe(res);
        archive.directory(projectPath, false);
        await archive.finalize();
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
