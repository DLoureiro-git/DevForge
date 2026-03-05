// DevForge V2 — Prisma Client Singleton
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function connectDB(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('[DB] Connected to database');
  } catch (error) {
    console.error('[DB] Failed to connect:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  await prisma.$disconnect();
  console.log('[DB] Disconnected from database');
}
