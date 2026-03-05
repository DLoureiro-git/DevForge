"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// DevForge V2 — Metrics Routes
const express_1 = require("express");
const prisma_js_1 = require("../lib/prisma.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// GET /api/metrics - Get user's project metrics
router.get('/', auth_js_1.extractUser, async (req, res, next) => {
    try {
        // Se não houver user, retornar métricas globais
        const whereClause = req.user?.id ? { userId: req.user.id } : {};
        const projects = await prisma_js_1.prisma.project.findMany({
            where: whereClause,
            select: {
                status: true,
                actualMin: true,
                qaScore: true,
                createdAt: true,
            },
        });
        const total = projects.length;
        const successful = projects.filter(p => p.status === 'DELIVERED').length;
        const failed = projects.filter(p => p.status === 'FAILED').length;
        // Calcular tempo médio (apenas projectos com actualMin)
        const projectsWithTime = projects.filter(p => p.actualMin);
        const avgDuration = projectsWithTime.length > 0
            ? Math.round(projectsWithTime.reduce((sum, p) => sum + (p.actualMin || 0), 0) / projectsWithTime.length)
            : 0;
        const avgDurationStr = avgDuration > 0
            ? `${avgDuration}m`
            : '—';
        res.json({
            total,
            successful,
            failed,
            avgDuration: avgDurationStr,
            successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
