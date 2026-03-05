// DevForge V2 — Sprints Routes
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
import { ensureProjectOwner } from '../middleware/multiTenant.js';
const router = Router();
// Helper to ensure param is string
function getParamId(param) {
    return Array.isArray(param) ? param[0] : param;
}
// GET /api/projects/:id/sprints - List all sprints for project
router.get('/:id/sprints', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        await ensureProjectOwner(projectId, req.user.id);
        const sprints = await prisma.sprint.findMany({
            where: { projectId },
            include: {
                features: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        storyPoints: true,
                    },
                },
                _count: {
                    select: { features: true },
                },
            },
            orderBy: { number: 'asc' },
        });
        res.json(sprints);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/sprints - Create new sprint
router.post('/:id/sprints', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        await ensureProjectOwner(projectId, req.user.id);
        const { goal, startDate, endDate, capacity } = req.body;
        if (!goal) {
            throw new AppError('Sprint goal is required', 400);
        }
        // Get next sprint number
        const lastSprint = await prisma.sprint.findFirst({
            where: { projectId },
            orderBy: { number: 'desc' },
        });
        const number = lastSprint ? lastSprint.number + 1 : 1;
        const sprint = await prisma.sprint.create({
            data: {
                projectId,
                number,
                goal,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                plannedPoints: capacity || 40, // default 40 story points
                status: 'PLANNING',
            },
            include: {
                features: true,
                _count: {
                    select: { features: true },
                },
            },
        });
        res.status(201).json(sprint);
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/projects/:id/sprints/:sid - Update sprint
router.put('/:id/sprints/:sid', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const sprintId = getParamId(req.params.sid);
        await ensureProjectOwner(projectId, req.user.id);
        const { goal, startDate, endDate, plannedPoints } = req.body;
        // Verify sprint belongs to project
        const existingSprint = await prisma.sprint.findFirst({
            where: {
                id: sprintId,
                projectId,
            },
        });
        if (!existingSprint) {
            throw new AppError('Sprint not found', 404);
        }
        const updated = await prisma.sprint.update({
            where: { id: sprintId },
            data: {
                goal,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                plannedPoints,
            },
            include: {
                features: true,
                _count: {
                    select: { features: true },
                },
            },
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/sprints/:sid/start - Start sprint
router.post('/:id/sprints/:sid/start', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const sprintId = getParamId(req.params.sid);
        await ensureProjectOwner(projectId, req.user.id);
        const sprint = await prisma.sprint.findFirst({
            where: {
                id: sprintId,
                projectId,
            },
        });
        if (!sprint) {
            throw new AppError('Sprint not found', 404);
        }
        if (sprint.status !== 'PLANNING') {
            throw new AppError('Sprint can only be started from PLANNING status', 400);
        }
        // Check if there's already an active sprint
        const activeSprint = await prisma.sprint.findFirst({
            where: {
                projectId,
                status: 'ACTIVE',
            },
        });
        if (activeSprint) {
            throw new AppError('There is already an active sprint. Complete it first.', 400);
        }
        const updated = await prisma.sprint.update({
            where: { id: sprintId },
            data: {
                status: 'ACTIVE',
                startDate: sprint.startDate || new Date(),
            },
            include: {
                features: true,
                _count: {
                    select: { features: true },
                },
            },
        });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/sprints/:sid/end - End sprint
router.post('/:id/sprints/:sid/end', requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const sprintId = getParamId(req.params.sid);
        await ensureProjectOwner(projectId, req.user.id);
        const sprint = await prisma.sprint.findFirst({
            where: {
                id: sprintId,
                projectId,
            },
            include: {
                features: true,
            },
        });
        if (!sprint) {
            throw new AppError('Sprint not found', 404);
        }
        if (sprint.status !== 'ACTIVE') {
            throw new AppError('Only active sprints can be completed', 400);
        }
        // Calculate completion stats
        const completedFeatures = sprint.features.filter((f) => f.status === 'DONE');
        const totalStoryPoints = sprint.features.reduce((sum, f) => sum + (f.storyPoints || 0), 0);
        const completedStoryPoints = completedFeatures.reduce((sum, f) => sum + (f.storyPoints || 0), 0);
        const updated = await prisma.sprint.update({
            where: { id: sprintId },
            data: {
                status: 'DONE',
                endDate: new Date(),
                deliveredPoints: completedStoryPoints,
            },
            include: {
                features: true,
                _count: {
                    select: { features: true },
                },
            },
        });
        res.json({
            sprint: updated,
            stats: {
                totalFeatures: sprint.features.length,
                completedFeatures: completedFeatures.length,
                totalStoryPoints,
                completedStoryPoints,
                velocity: completedStoryPoints,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
