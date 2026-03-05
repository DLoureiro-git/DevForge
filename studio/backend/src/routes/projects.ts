// DevForge V2 — Projects Routes
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { sseManager } from '../lib/sse.js';
import archiver from 'archiver';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { PMAgent } from '../services/pm-agent.js';
import { Pipeline } from '../services/orchestrator.js';

const router = Router();

// Helper to ensure param is string
function getParamId(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// POST /api/projects - Create new project and start intake
router.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      throw new AppError('Name and description are required', 400);
    }

    const project = await prisma.project.create({
      data: {
        userId: req.user!.id,
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
    await prisma.phase.create({
      data: {
        projectId: project.id,
        type: 'PM',
        status: 'PENDING',
      },
    });

    // TODO: Trigger PM Agent intake process

    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects - List user's projects
router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
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
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: getParamId(req.params.id),
        userId: req.user!.id,
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
      throw new AppError('Project not found', 404);
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/chat - Send message to PM Agent
router.post('/:id/chat', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      throw new AppError('Message content is required', 400);
    }

    const project = await prisma.project.findFirst({
      where: {
        id: getParamId(req.params.id),
        userId: req.user!.id,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Save user message
    const userMessage = await prisma.message.create({
      data: {
        projectId: project.id,
        role: 'USER',
        content,
      },
    });

    // Get user's Anthropic API Key from Settings
    const settings = await prisma.settings.findUnique({
      where: { userId: req.user!.id },
    });

    const userApiKey = settings?.anthropicKey;
    if (!userApiKey) {
      throw new AppError('API Key not configured. Please add your Anthropic API Key in Settings.', 400);
    }

    // Get all messages for context
    const allMessages = await prisma.message.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'asc' },
    });

    // Send to PM Agent
    const pmAgent = new PMAgent(userApiKey);
    const pmResponse = await pmAgent.processMessage(content, allMessages);

    // Save agent response
    const agentMessage = await prisma.message.create({
      data: {
        projectId: project.id,
        role: 'AGENT',
        content: pmResponse.agentResponse,
      },
    });

    // If intake complete, save PRD
    if (pmResponse.isComplete && pmResponse.prd) {
      await prisma.project.update({
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
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/confirm - Confirm PRD and start build
router.post('/:id/confirm', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: getParamId(req.params.id),
        userId: req.user!.id,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (project.status !== 'INTAKE' && project.status !== 'PLANNING') {
      throw new AppError('Project cannot be confirmed in current status', 400);
    }

    if (!project.prd) {
      throw new AppError('PRD not generated yet', 400);
    }

    // Update project status
    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { status: 'BUILDING' },
    });

    // Get user settings for API Key and Ollama config
    const settings = await prisma.settings.findUnique({
      where: { userId: req.user!.id },
    });

    // Trigger build pipeline
    const pipeline = new Pipeline({
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
      const exists = await prisma.project.findUnique({
        where: { id: project.id },
      });

      if (exists) {
        await prisma.project.update({
          where: { id: project.id },
          data: { status: 'FAILED' },
        });
      }

      sseManager.send(project.id, {
        type: 'error',
        error: error.message,
      });
    });

    sseManager.send(project.id, {
      type: 'status',
      status: 'BUILDING',
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/pause - Pause project
router.post('/:id/pause', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: getParamId(req.params.id),
        userId: req.user!.id,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { status: 'PAUSED' },
    });

    // TODO: Pause build pipeline

    sseManager.send(project.id, {
      type: 'status',
      status: 'PAUSED',
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// POST /api/projects/:id/resume - Resume paused project
router.post('/:id/resume', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: getParamId(req.params.id),
        userId: req.user!.id,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (project.status !== 'PAUSED') {
      throw new AppError('Project is not paused', 400);
    }

    // Determine next status based on last phase
    const lastPhase = await prisma.phase.findFirst({
      where: { projectId: project.id },
      orderBy: { startedAt: 'desc' },
    });

    let nextStatus = 'BUILDING';
    if (lastPhase?.type === 'QA') {
      nextStatus = 'QA';
    } else if (lastPhase?.type === 'BUGFIX') {
      nextStatus = 'FIXING';
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { status: nextStatus as any },
    });

    // TODO: Resume build pipeline

    sseManager.send(project.id, {
      type: 'status',
      status: nextStatus,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/stream - SSE logs stream
router.get('/:id/stream', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: getParamId(req.params.id),
        userId: req.user!.id,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    sseManager.addConnection(project.id, res);
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id/download - Download project ZIP
router.get('/:id/download', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: getParamId(req.params.id),
        userId: req.user!.id,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    if (!project.outputPath) {
      throw new AppError('Project has not been built yet', 400);
    }

    const projectPath = path.resolve(project.outputPath);

    if (!existsSync(projectPath)) {
      throw new AppError('Project files not found', 404);
    }

    if (!statSync(projectPath).isDirectory()) {
      throw new AppError('Invalid project path', 400);
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.zip"`);

    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(res);
    archive.directory(projectPath, false);
    await archive.finalize();
  } catch (error) {
    next(error);
  }
});

export default router;
