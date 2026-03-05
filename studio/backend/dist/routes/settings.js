// DevForge V2 — Settings Routes
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
// GET /api/settings
router.get('/', requireAuth, async (req, res, next) => {
    try {
        let settings = await prisma.settings.findUnique({
            where: { userId: req.user.id },
        });
        if (!settings) {
            // Create default settings
            settings = await prisma.settings.create({
                data: {
                    userId: req.user.id,
                },
            });
        }
        // Mask sensitive data
        const response = {
            ...settings,
            anthropicKey: settings.anthropicKey ? '***' + settings.anthropicKey.slice(-4) : null,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
// PUT /api/settings
router.put('/', requireAuth, async (req, res, next) => {
    try {
        const { anthropicKey, ollamaUrl, ollamaModelDev, ollamaModelFix, outputDirectory, notifyEmail, notifyDesktop, deployTarget, } = req.body;
        const data = {};
        if (anthropicKey !== undefined)
            data.anthropicKey = anthropicKey;
        if (ollamaUrl !== undefined)
            data.ollamaUrl = ollamaUrl;
        if (ollamaModelDev !== undefined)
            data.ollamaModelDev = ollamaModelDev;
        if (ollamaModelFix !== undefined)
            data.ollamaModelFix = ollamaModelFix;
        if (outputDirectory !== undefined)
            data.outputDirectory = outputDirectory;
        if (notifyEmail !== undefined)
            data.notifyEmail = notifyEmail;
        if (notifyDesktop !== undefined)
            data.notifyDesktop = notifyDesktop;
        if (deployTarget !== undefined)
            data.deployTarget = deployTarget;
        const settings = await prisma.settings.upsert({
            where: { userId: req.user.id },
            update: data,
            create: {
                userId: req.user.id,
                ...data,
            },
        });
        // Mask sensitive data
        const response = {
            ...settings,
            anthropicKey: settings.anthropicKey ? '***' + settings.anthropicKey.slice(-4) : null,
        };
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
export default router;
