"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeInput = sanitizeInput;
exports.sanitizeBody = sanitizeBody;
exports.verifyProjectOwnership = verifyProjectOwnership;
exports.buildUserFilter = buildUserFilter;
exports.ensureProjectOwner = ensureProjectOwner;
exports.ensureSprintOwner = ensureSprintOwner;
exports.ensureBugOwner = ensureBugOwner;
exports.injectUserFilter = injectUserFilter;
const prisma_js_1 = require("../lib/prisma.js");
const error_js_1 = require("./error.js");
const zod_1 = require("zod");
const validator_1 = __importDefault(require("validator"));
/**
 * Sanitiza input para prevenir XSS
 */
function sanitizeInput(input) {
    return validator_1.default.escape(input);
}
/**
 * Valida UUID format
 */
const uuidSchema = zod_1.z.string().uuid('Invalid ID format');
/**
 * Middleware para sanitizar body automaticamente
 */
function sanitizeBody(req, res, next) {
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
async function verifyProjectOwnership(req, res, next) {
    try {
        if (!req.user) {
            throw new error_js_1.AppError('User not authenticated', 401);
        }
        const projectId = req.params.id || req.params.projectId;
        if (!projectId) {
            throw new error_js_1.AppError('Project ID not provided', 400);
        }
        // Validate UUID format
        const id = Array.isArray(projectId) ? projectId[0] : projectId;
        const validId = uuidSchema.parse(id);
        const project = await prisma_js_1.prisma.project.findFirst({
            where: {
                id: validId,
                userId: req.user.id,
            },
            select: { id: true },
        });
        if (!project) {
            throw new error_js_1.AppError('Project not found or access denied', 404);
        }
        next();
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            next(new error_js_1.AppError('Invalid project ID format', 400));
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
function buildUserFilter(userId) {
    return { userId };
}
/**
 * Helper para garantir que o user é owner do project antes de queries
 */
async function ensureProjectOwner(projectId, userId) {
    // Validate UUID format
    const validProjectId = uuidSchema.parse(projectId);
    const validUserId = uuidSchema.parse(userId);
    const project = await prisma_js_1.prisma.project.findFirst({
        where: {
            id: validProjectId,
            userId: validUserId,
        },
    });
    if (!project) {
        throw new error_js_1.AppError('Project not found or access denied', 404);
    }
    return project;
}
/**
 * Helper para validar ownership de Sprint
 */
async function ensureSprintOwner(sprintId, projectId, userId) {
    const validSprintId = uuidSchema.parse(sprintId);
    const validProjectId = uuidSchema.parse(projectId);
    const validUserId = uuidSchema.parse(userId);
    const sprint = await prisma_js_1.prisma.sprint.findFirst({
        where: {
            id: validSprintId,
            projectId: validProjectId,
            project: {
                userId: validUserId,
            },
        },
    });
    if (!sprint) {
        throw new error_js_1.AppError('Sprint not found or access denied', 404);
    }
    return sprint;
}
/**
 * Helper para validar ownership de Bug
 */
async function ensureBugOwner(bugId, projectId, userId) {
    const validBugId = uuidSchema.parse(bugId);
    const validProjectId = uuidSchema.parse(projectId);
    const validUserId = uuidSchema.parse(userId);
    const bug = await prisma_js_1.prisma.bug.findFirst({
        where: {
            id: validBugId,
            projectId: validProjectId,
            project: {
                userId: validUserId,
            },
        },
    });
    if (!bug) {
        throw new error_js_1.AppError('Bug not found or access denied', 404);
    }
    return bug;
}
/**
 * Middleware genérico para adicionar filtro userId em queries
 * Protege contra acesso cross-tenant
 */
function injectUserFilter(req, res, next) {
    if (!req.user) {
        next(new error_js_1.AppError('User not authenticated', 401));
        return;
    }
    // Attach userId filter to request for easy reuse
    req.userFilter = { userId: req.user.id };
    next();
}
