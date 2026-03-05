"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
// DevForge V2 — Prisma Client Singleton
const client_1 = require("@prisma/client");
const globalForPrisma = globalThis;
exports.prisma = globalForPrisma.prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
async function connectDB() {
    try {
        await exports.prisma.$connect();
        console.log('[DB] Connected to database');
    }
    catch (error) {
        console.error('[DB] Failed to connect:', error);
        throw error;
    }
}
async function disconnectDB() {
    await exports.prisma.$disconnect();
    console.log('[DB] Disconnected from database');
}
