// DevForge V2 — Express Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './lib/prisma.js';
import { checkAnthropicHealth } from './lib/anthropic.js';
import { checkOllamaHealth } from './lib/ollama.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import settingsRoutes from './routes/settings.js';
import healthRoutes from './routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5680;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5679';

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DevForge V2 API',
    version: '2.0.0',
    status: 'running',
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Startup
async function startup() {
  try {
    console.log('[DevForge] Starting server...');

    // Connect to database
    await connectDB();

    // Check Anthropic
    const anthropicHealthy = await checkAnthropicHealth();
    if (anthropicHealthy) {
      console.log('[Anthropic] API key validated');
    } else {
      console.warn('[Anthropic] API key not configured or invalid');
    }

    // Check Ollama
    const ollamaHealthy = await checkOllamaHealth();
    if (ollamaHealthy) {
      console.log('[Ollama] Connected successfully');
    } else {
      console.warn('[Ollama] Not available - code generation will not work');
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`[DevForge] Server running on http://localhost:${PORT}`);
      console.log(`[DevForge] Frontend: ${FRONTEND_URL}`);
    });
  } catch (error) {
    console.error('[DevForge] Startup failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n[DevForge] Shutting down...');
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start
startup();
