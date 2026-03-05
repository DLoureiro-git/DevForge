import { prisma } from '../lib/prisma.js';
export async function requireAuth(req, res, next) {
    try {
        // For now, we'll use a simple header-based auth
        // TODO: Replace with Better-Auth session validation
        const userId = req.headers['x-user-id'];
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized: No user ID provided' });
            return;
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                plan: true,
            },
        });
        if (!user) {
            res.status(401).json({ error: 'Unauthorized: User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error('[Auth] Middleware error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
export async function extractUser(req, res, next) {
    try {
        const userId = req.headers['x-user-id'];
        if (userId) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    plan: true,
                },
            });
            if (user) {
                req.user = user;
            }
        }
        next();
    }
    catch (error) {
        console.error('[Auth] Extract user error:', error);
        next();
    }
}
