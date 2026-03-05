"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// DevForge V2 — Express Server
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const prisma_js_1 = require("./lib/prisma.js");
const anthropic_js_1 = require("./lib/anthropic.js");
const ollama_js_1 = require("./lib/ollama.js");
const error_js_1 = require("./middleware/error.js");
const multiTenant_js_1 = require("./middleware/multiTenant.js");
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const projects_js_1 = __importDefault(require("./routes/projects.js"));
const sprints_js_1 = __importDefault(require("./routes/sprints.js"));
const features_js_1 = __importDefault(require("./routes/features.js"));
const team_js_1 = __importDefault(require("./routes/team.js"));
const settings_js_1 = __importDefault(require("./routes/settings.js"));
const health_js_1 = __importDefault(require("./routes/health.js"));
const ollama_js_2 = __importDefault(require("./routes/ollama.js"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5680;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5679';
// Security: Helmet
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
}));
// Security: Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Max 100 requests per 15min per IP
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Max 10 auth attempts per 15min
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
});
// Apply rate limiting to all API routes
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
// Middleware
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Security: Sanitize inputs
app.use(multiTenant_js_1.sanitizeBody);
// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});
// Routes
app.use('/api/auth', auth_js_1.default);
app.use('/api/projects', projects_js_1.default);
app.use('/api/projects', sprints_js_1.default);
app.use('/api/projects', features_js_1.default);
app.use('/api/projects', team_js_1.default);
app.use('/api/settings', settings_js_1.default);
app.use('/api/health', health_js_1.default);
app.use('/api/ollama', ollama_js_2.default);
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'DevForge V2 API',
        version: '2.0.0',
        status: 'running',
    });
});
// Error handling
app.use(error_js_1.notFound);
app.use(error_js_1.errorHandler);
// Startup
async function startup() {
    try {
        console.log('[DevForge] Starting server...');
        // Connect to database
        await (0, prisma_js_1.connectDB)();
        // Check Anthropic
        const anthropicHealthy = await (0, anthropic_js_1.checkAnthropicHealth)();
        if (anthropicHealthy) {
            console.log('[Anthropic] API key validated');
        }
        else {
            console.warn('[Anthropic] API key not configured or invalid');
        }
        // Check Ollama
        const ollamaHealthy = await (0, ollama_js_1.checkOllamaHealth)();
        if (ollamaHealthy) {
            console.log('[Ollama] Connected successfully');
        }
        else {
            console.warn('[Ollama] Not available - code generation will not work');
        }
        // Start server
        const server = app.listen(PORT, () => {
            console.log(`[DevForge] Server running on http://localhost:${PORT}`);
            console.log(`[DevForge] Frontend: ${FRONTEND_URL}`);
        });
        // Initialize WebSocket server
        const { initWebSocketServer } = await Promise.resolve().then(() => __importStar(require('./lib/websocket.js')));
        initWebSocketServer(server);
    }
    catch (error) {
        console.error('[DevForge] Startup failed:', error);
        process.exit(1);
    }
}
// Graceful shutdown
async function shutdown() {
    console.log('\n[DevForge] Shutting down...');
    await (0, prisma_js_1.disconnectDB)();
    process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
// Start
startup();
