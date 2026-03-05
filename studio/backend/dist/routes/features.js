// DevForge V2 — Features Routes
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { ensureProjectOwner } from '../middleware/multiTenant.js';
import { ScrumMaster } from '../services/scrumMaster.js';
const router = Router();
// Helper to ensure param is string
function getParamId(param) {
    return Array.isArray(param) ? param[0] : param;
}
// GET /api/projects/:id/features - List features with filters
router.get('/:id/features', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        await ensureProjectOwner(projectId, req.user.id);
        const { status, sprint, assignedTo } = req.query;
        const features = await prisma.feature.findMany({
            where: {
                projectId,
                ...(status && { status: status }),
                ...(sprint && { sprintId: sprint }),
                ...(assignedTo && { assignedAgentId: assignedTo }),
            },
            include: {
                sprint: {
                    select: {
                        id: true,
                        number: true,
                        goal: true,
                    },
                },
                requestedBy: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true,
                    },
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    include: {
                        author: {
                            select: {
                                displayName: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { comments: true },
                },
            },
            orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        });
        res.json(features);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/features - Create new feature
router.post('/:id/features', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const project = await ensureProjectOwner(projectId, req.user.id);
        const { title, description, acceptanceCriteria, priority, sprintId, assignedAgentId, requestedById, type, } = req.body;
        if (!title || !description || !requestedById) {
            throw new AppError('Title, description, and requestedById are required', 400);
        }
        // Verify requestedBy team member exists and belongs to project
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                id: requestedById,
                projectId,
            },
        });
        if (!teamMember) {
            throw new AppError('Requested team member not found', 404);
        }
        // Auto-estimate story points using Scrum Master service
        const settings = await prisma.settings.findUnique({
            where: { userId: req.user.id },
        });
        let storyPoints = 3; // default
        if (settings?.anthropicKey) {
            const scrumMaster = new ScrumMaster(settings.anthropicKey);
            storyPoints = await scrumMaster.estimateStoryPoints({
                title,
                description,
                acceptanceCriteria: acceptanceCriteria || '',
            });
        }
        const feature = await prisma.feature.create({
            data: {
                projectId,
                title,
                description,
                acceptanceCriteria: acceptanceCriteria || '[]',
                priority: priority || 'MEDIUM',
                status: 'BACKLOG',
                type: type || 'FEATURE',
                storyPoints,
                sprintId,
                assignedAgentId,
                requestedById,
            },
            include: {
                sprint: {
                    select: {
                        id: true,
                        number: true,
                        goal: true,
                    },
                },
                requestedBy: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true,
                    },
                },
                comments: true,
            },
        });
        res.status(201).json(feature);
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/projects/:id/features/:fid - Update feature
router.put('/:id/features/:fid', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const featureId = getParamId(req.params.fid);
        await ensureProjectOwner(projectId, req.user.id);
        const { title, description, acceptanceCriteria, status, priority, storyPoints, sprintId, assignedAgentId, agentProgress, qaScore, type, } = req.body;
        // Verify feature belongs to project
        const existingFeature = await prisma.feature.findFirst({
            where: {
                id: featureId,
                projectId,
            },
        });
        if (!existingFeature) {
            throw new AppError('Feature not found', 404);
        }
        // Check WIP limit if moving to IN_PROGRESS
        if (status === 'IN_PROGRESS' && existingFeature.status !== 'IN_PROGRESS') {
            const settings = await prisma.settings.findUnique({
                where: { userId: req.user.id },
            });
            if (settings?.anthropicKey) {
                const scrumMaster = new ScrumMaster(settings.anthropicKey);
                const canMove = await scrumMaster.checkWIPLimit(projectId, 'IN_PROGRESS');
                if (!canMove) {
                    throw new AppError('WIP limit reached for IN_PROGRESS. Complete some features first.', 400);
                }
            }
        }
        const updated = await prisma.feature.update({
            where: { id: featureId },
            data: {
                title,
                description,
                acceptanceCriteria,
                status,
                priority,
                storyPoints,
                sprintId,
                assignedAgentId,
                agentProgress,
                qaScore,
                type,
            },
            include: {
                sprint: {
                    select: {
                        id: true,
                        number: true,
                        goal: true,
                    },
                },
                requestedBy: {
                    select: {
                        id: true,
                        displayName: true,
                        role: true,
                    },
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        author: {
                            select: {
                                displayName: true,
                            },
                        },
                    },
                },
            },
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/projects/:id/features/:fid - Delete feature
router.delete('/:id/features/:fid', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const featureId = getParamId(req.params.fid);
        await ensureProjectOwner(projectId, req.user.id);
        // Verify feature belongs to project
        const existingFeature = await prisma.feature.findFirst({
            where: {
                id: featureId,
                projectId,
            },
        });
        if (!existingFeature) {
            throw new AppError('Feature not found', 404);
        }
        // Delete all comments first
        await prisma.comment.deleteMany({
            where: { featureId },
        });
        // Delete activity logs
        await prisma.activityLog.deleteMany({
            where: { featureId },
        });
        // Delete feature
        await prisma.feature.delete({
            where: { id: featureId },
        });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/features/:fid/start-build - Start building feature
router.post('/:id/features/:fid/start-build', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const featureId = getParamId(req.params.fid);
        const project = await ensureProjectOwner(projectId, req.user.id);
        const feature = await prisma.feature.findFirst({
            where: {
                id: featureId,
                projectId,
            },
        });
        if (!feature) {
            throw new AppError('Feature not found', 404);
        }
        if (feature.status !== 'BACKLOG' && feature.status !== 'READY' && feature.status !== 'IN_PROGRESS') {
            throw new AppError('Feature cannot be built in current status', 400);
        }
        // Verificar se project tem PRD e outputPath
        if (!project.prd) {
            throw new AppError('Project must have PRD generated first. Run PM Agent on the project.', 400);
        }
        if (!project.outputPath) {
            throw new AppError('Project must have code generated first. Run full pipeline on the project.', 400);
        }
        // Obter settings do user
        const settings = await prisma.settings.findUnique({
            where: { userId: req.user.id },
        });
        if (!settings?.anthropicKey) {
            throw new AppError('Anthropic API key not configured. Please configure in settings.', 400);
        }
        // Update to IN_PROGRESS
        const updated = await prisma.feature.update({
            where: { id: featureId },
            data: {
                status: 'IN_PROGRESS',
                agentProgress: 0,
            },
            include: {
                sprint: true,
                requestedBy: true,
            },
        });
        // Disparar Feature Pipeline em background
        const { runFeaturePipeline } = await import('../services/feature-orchestrator.js');
        // Executar pipeline em background (não esperar resposta)
        runFeaturePipeline({
            featureId,
            projectId,
            claudeApiKey: settings.anthropicKey,
            ollamaEndpoint: settings.ollamaUrl,
            ollamaModel: settings.ollamaModelDev,
            outputDirectory: settings.outputDirectory,
            autoFix: true,
            maxFixIterations: 10,
            targetQAScore: 95,
        }).catch((error) => {
            console.error(`[Feature Pipeline] Error for feature ${featureId}:`, error);
            // Atualizar feature para BLOCKED em caso de erro
            prisma.feature
                .update({
                where: { id: featureId },
                data: {
                    status: 'BLOCKED',
                    logs: JSON.stringify([
                        {
                            timestamp: new Date().toISOString(),
                            level: 'ERROR',
                            message: `Pipeline failed: ${error.message}`,
                            phase: 'ERROR',
                        },
                    ]),
                },
            })
                .catch((updateError) => {
                console.error('[Feature Pipeline] Failed to update feature status:', updateError);
            });
        });
        res.json({
            ...updated,
            message: 'Feature pipeline started in background',
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/features/:fid/comment - Add comment to feature
router.post('/:id/features/:fid/comment', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const featureId = getParamId(req.params.fid);
        await ensureProjectOwner(projectId, req.user.id);
        const { content, authorId } = req.body;
        if (!content || !authorId) {
            throw new AppError('Comment content and authorId are required', 400);
        }
        // Verify feature belongs to project
        const existingFeature = await prisma.feature.findFirst({
            where: {
                id: featureId,
                projectId,
            },
        });
        if (!existingFeature) {
            throw new AppError('Feature not found', 404);
        }
        // Verify author is a team member of the project
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                id: authorId,
                projectId,
            },
        });
        if (!teamMember) {
            throw new AppError('Author not found in project team', 404);
        }
        const comment = await prisma.comment.create({
            data: {
                featureId,
                content,
                authorId,
            },
            include: {
                author: {
                    select: {
                        displayName: true,
                        role: true,
                    },
                },
            },
        });
        res.status(201).json(comment);
    }
    catch (error) {
        next(error);
    }
});
export default router;
