// DevForge V2 — Auth Routes
import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../middleware/error.js';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
// POST /api/auth/register
router.post('/register', async (req, res, next) => {
    try {
        const { email, name, password } = req.body;
        if (!email || !password) {
            throw new AppError('Email and password are required', 400);
        }
        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            throw new AppError('User already exists', 409);
        }
        // TODO: Hash password with Better-Auth
        // For now, create user without password (will be handled by Better-Auth)
        const user = await prisma.user.create({
            data: {
                email,
                name: name || null,
                plan: 'FREE',
            },
            select: {
                id: true,
                email: true,
                name: true,
                plan: true,
                createdAt: true,
            },
        });
        // TODO: Create session with Better-Auth
        res.status(201).json({
            user,
            // TODO: Return session token
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new AppError('Email and password are required', 400);
        }
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                plan: true,
            },
        });
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }
        // TODO: Verify password with Better-Auth
        // TODO: Create session with Better-Auth
        res.json({
            user,
            // TODO: Return session token
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/auth/logout
router.post('/logout', requireAuth, async (req, res, next) => {
    try {
        // TODO: Destroy session with Better-Auth
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                plan: true,
                createdAt: true,
                _count: {
                    select: {
                        projects: true,
                    },
                },
            },
        });
        if (!user) {
            throw new AppError('User not found', 404);
        }
        res.json(user);
    }
    catch (error) {
        next(error);
    }
});
export default router;
