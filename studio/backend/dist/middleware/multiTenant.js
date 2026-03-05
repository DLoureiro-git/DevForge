import { prisma } from '../lib/prisma.js';
import { AppError } from './error.js';
import { z } from 'zod';
import validator from 'validator';
/**
 * Sanitiza input para prevenir XSS
 */
export function sanitizeInput(input) {
    return validator.escape(input);
}
/**
 * Valida UUID format
 */
const uuidSchema = z.string().uuid('Invalid ID format');
/**
 * Middleware para sanitizar body automaticamente
 */
export function sanitizeBody(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
                req.body[key] = sanitizeInput(req.body[key]);
            }
        }
    }
    next();
}
/**
 * Verifica que o user tem acesso ao project especificado
 * Deve ser usado DEPOIS do requireAuth
 */
export async function verifyProjectOwnership(req, res, next) {
    try {
        if (!req.user) {
            throw new AppError('User not authenticated', 401);
        }
        const projectId = req.params.id || req.params.projectId;
        if (!projectId) {
            throw new AppError('Project ID not provided', 400);
        }
        // Validate UUID format
        const id = Array.isArray(projectId) ? projectId[0] : projectId;
        const validId = uuidSchema.parse(id);
        const project = await prisma.project.findFirst({
            where: {
                id: validId,
                userId: req.user.id,
            },
            select: { id: true },
        });
        if (!project) {
            throw new AppError('Project not found or access denied', 404);
        }
        next();
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            next(new AppError('Invalid project ID format', 400));
        }
        else {
            next(error);
        }
    }
}
/**
 * Helper para garantir que queries filtram por userId
 * Usar em todas as queries de dados multi-tenant
 */
export function buildUserFilter(userId) {
    return { userId };
}
/**
 * Helper para garantir que o user é owner do project antes de queries
 */
export async function ensureProjectOwner(projectId, userId) {
    // Validate UUID format
    const validProjectId = uuidSchema.parse(projectId);
    const validUserId = uuidSchema.parse(userId);
    const project = await prisma.project.findFirst({
        where: {
            id: validProjectId,
            userId: validUserId,
        },
    });
    if (!project) {
        throw new AppError('Project not found or access denied', 404);
    }
    return project;
}
/**
 * Helper para validar ownership de Sprint
 */
export async function ensureSprintOwner(sprintId, projectId, userId) {
    const validSprintId = uuidSchema.parse(sprintId);
    const validProjectId = uuidSchema.parse(projectId);
    const validUserId = uuidSchema.parse(userId);
    const sprint = await prisma.sprint.findFirst({
        where: {
            id: validSprintId,
            projectId: validProjectId,
            project: {
                userId: validUserId,
            },
        },
    });
    if (!sprint) {
        throw new AppError('Sprint not found or access denied', 404);
    }
    return sprint;
}
/**
 * Helper para validar ownership de Bug
 */
export async function ensureBugOwner(bugId, projectId, userId) {
    const validBugId = uuidSchema.parse(bugId);
    const validProjectId = uuidSchema.parse(projectId);
    const validUserId = uuidSchema.parse(userId);
    const bug = await prisma.bug.findFirst({
        where: {
            id: validBugId,
            projectId: validProjectId,
            project: {
                userId: validUserId,
            },
        },
    });
    if (!bug) {
        throw new AppError('Bug not found or access denied', 404);
    }
    return bug;
}
/**
 * Middleware genérico para adicionar filtro userId em queries
 * Protege contra acesso cross-tenant
 */
export function injectUserFilter(req, res, next) {
    if (!req.user) {
        next(new AppError('User not authenticated', 401));
        return;
    }
    // Attach userId filter to request for easy reuse
    req.userFilter = { userId: req.user.id };
    next();
}
