// DevForge V2 — Metrics Routes
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/metrics - Get user's project metrics
router.get('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.user!.id },
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
  } catch (error) {
    next(error);
  }
});

export default router;
