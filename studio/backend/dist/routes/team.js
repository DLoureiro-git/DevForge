"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// DevForge V2 — Team Routes
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const error_js_1 = require("../middleware/error.js");
const auth_js_1 = require("../middleware/auth.js");
const multiTenant_js_1 = require("../middleware/multiTenant.js");
const router = (0, express_1.Router)();
// Helper to ensure param is string
function getParamId(param) {
    return Array.isArray(param) ? param[0] : param;
}
// GET /api/projects/:id/team - List team members
router.get('/:id/team', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        await (0, multiTenant_js_1.ensureProjectOwner)(projectId, req.user.id);
        const teamMembers = await prisma_js_1.prisma.teamMember.findMany({
            where: { projectId },
            include: {
                _count: {
                    select: {
                        features: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json(teamMembers);
    }
    catch (error) {
        next(error);
    }
});
// POST /api/projects/:id/team - Add team member
router.post('/:id/team', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        await (0, multiTenant_js_1.ensureProjectOwner)(projectId, req.user.id);
        const { userId, displayName, email, role, avatar } = req.body;
        if (!userId || !displayName || !email || !role) {
            throw new error_js_1.AppError('userId, displayName, email, and role are required', 400);
        }
        // Validate role
        const validRoles = ['OWNER', 'PRODUCT_OWNER', 'DEVELOPER', 'STAKEHOLDER'];
        if (!validRoles.includes(role)) {
            throw new error_js_1.AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
        }
        // Check if member with same email already exists
        const existing = await prisma_js_1.prisma.teamMember.findFirst({
            where: {
                projectId,
                email,
            },
        });
        if (existing) {
            throw new error_js_1.AppError('Team member with this email already exists', 400);
        }
        const teamMember = await prisma_js_1.prisma.teamMember.create({
            data: {
                projectId,
                userId,
                displayName,
                email,
                role,
                avatar,
                isOnline: false,
            },
            include: {
                _count: {
                    select: {
                        features: true,
                    },
                },
            },
        });
        res.status(201).json(teamMember);
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/projects/:id/team/:tid - Remove team member
router.delete('/:id/team/:tid', auth_js_1.requireAuth, async (req, res, next) => {
    try {
        const projectId = getParamId(req.params.id);
        const teamMemberId = getParamId(req.params.tid);
        await (0, multiTenant_js_1.ensureProjectOwner)(projectId, req.user.id);
        // Verify team member belongs to project
        const existingMember = await prisma_js_1.prisma.teamMember.findFirst({
            where: {
                id: teamMemberId,
                projectId,
            },
            include: {
                features: true,
                comments: true,
            },
        });
        if (!existingMember) {
            throw new error_js_1.AppError('Team member not found', 404);
        }
        // Check if member has requested features
        if (existingMember.features.length > 0) {
            throw new error_js_1.AppError('Cannot remove team member with requested features. Reassign features first.', 400);
        }
        // Check if member has comments
        if (existingMember.comments.length > 0) {
            throw new error_js_1.AppError('Cannot remove team member with comments in features.', 400);
        }
        await prisma_js_1.prisma.teamMember.delete({
            where: { id: teamMemberId },
        });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
