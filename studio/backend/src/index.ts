// DevForge V2 — Express Server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB, disconnectDB } from './lib/prisma.js';
import { checkAnthropicHealth } from './lib/anthropic.js';
import { checkOllamaHealth } from './lib/ollama.js';
import { errorHandler, notFound } from './middleware/error.js';
import { sanitizeBody } from './middleware/multiTenant.js';
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import sprintsRoutes from './routes/sprints.js';
import featuresRoutes from './routes/features.js';
import teamRoutes from './routes/team.js';
import settingsRoutes from './routes/settings.js';
import healthRoutes from './routes/health.js';
import ollamaRoutes from './routes/ollama.js';
import metricsRoutes from './routes/metrics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5680;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5679';

// Security: Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);

// Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15min per IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 auth attempts per 15min
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Middleware
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security: Sanitize inputs
app.use(sanitizeBody);

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects', sprintsRoutes);
app.use('/api/projects', featuresRoutes);
app.use('/api/projects', teamRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/ollama', ollamaRoutes);
app.use('/api/metrics', metricsRoutes);

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
    const server = app.listen(PORT, () => {
      console.log(`[DevForge] Server running on http://localhost:${PORT}`);
      console.log(`[DevForge] Frontend: ${FRONTEND_URL}`);
    });

    // Initialize WebSocket server
    const { initWebSocketServer } = await import('./lib/websocket.js');
    initWebSocketServer(server);
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
