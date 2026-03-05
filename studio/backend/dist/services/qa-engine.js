"use strict";
/**
 * DevForge V2 - Motor Principal de QA Inteligente
 * Gera checklists adaptativas baseadas no PRD e calcula scores de qualidade
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMAIL_CHECKS = exports.FILE_UPLOAD_CHECKS = exports.REALTIME_CHECKS = exports.PAYMENT_CHECKS = exports.AUTH_CHECKS = exports.UNIVERSAL_CHECKS = void 0;
exports.analyzePRD = analyzePRD;
exports.generateAdaptiveChecklist = generateAdaptiveChecklist;
exports.calculateQAScore = calculateQAScore;
exports.initBrowser = initBrowser;
exports.estimateTotalTime = estimateTotalTime;
exports.groupChecksByCategory = groupChecksByCategory;
exports.getAutomatableChecks = getAutomatableChecks;
exports.getCriticalChecks = getCriticalChecks;
const playwright_1 = require("playwright");
// ============================================================================
// CONSTANTS - UNIVERSAL CHECKS (SEMPRE EXECUTADOS)
// ============================================================================
exports.UNIVERSAL_CHECKS = [
    // DEPLOY
    {
        id: 'deploy-001',
        category: 'deploy',
        priority: 'critical',
        description: 'Deploy produção funciona (Railway/Vercel)',
        validator: 'validateDeploy',
        automatable: true,
        estimatedTime: 5,
    },
    {
        id: 'deploy-002',
        category: 'deploy',
        priority: 'critical',
        description: 'Variáveis de ambiente configuradas',
        validator: 'validateEnvVars',
        automatable: true,
        estimatedTime: 2,
    },
    {
        id: 'deploy-003',
        category: 'deploy',
        priority: 'high',
        description: 'Build produção sem erros',
        validator: 'validateBuildSuccess',
        automatable: true,
        estimatedTime: 3,
    },
    {
        id: 'deploy-004',
        category: 'deploy',
        priority: 'critical',
        description: 'Full-stack integrado (Frontend + Backend + DB)',
        validator: 'validateFullStack',
        automatable: true,
        estimatedTime: 5,
    },
    // RESPONSIVE
    {
        id: 'responsive-001',
        category: 'responsive',
        priority: 'critical',
        description: 'Sem overflow horizontal em mobile',
        validator: 'checkHorizontalOverflow',
        automatable: true,
        estimatedTime: 3,
    },
    {
        id: 'responsive-002',
        category: 'responsive',
        priority: 'high',
        description: 'Touch targets ≥44x44px',
        validator: 'checkTouchTargets',
        automatable: true,
        estimatedTime: 2,
    },
    {
        id: 'responsive-003',
        category: 'responsive',
        priority: 'high',
        description: 'Breakpoints 375px, 768px, 1024px, 1440px funcionam',
        validator: 'validateBreakpoints',
        automatable: true,
        estimatedTime: 4,
    },
    {
        id: 'responsive-004',
        category: 'responsive',
        priority: 'medium',
        description: 'Texto legível em todos os tamanhos (min 14px mobile)',
        validator: 'validateTextReadability',
        automatable: true,
        estimatedTime: 2,
    },
    // DATABASE
    {
        id: 'db-001',
        category: 'db',
        priority: 'critical',
        description: 'Persistência de dados funciona',
        validator: 'validateDataPersistence',
        automatable: true,
        estimatedTime: 3,
    },
    {
        id: 'db-002',
        category: 'db',
        priority: 'high',
        description: 'Writes concorrentes não criam duplicados',
        validator: 'validateConcurrentWrites',
        automatable: true,
        estimatedTime: 4,
    },
    {
        id: 'db-003',
        category: 'db',
        priority: 'critical',
        description: 'Migrations aplicadas corretamente',
        validator: 'validateMigrations',
        automatable: true,
        estimatedTime: 2,
    },
    // FORMS
    {
        id: 'forms-001',
        category: 'forms',
        priority: 'critical',
        description: 'Validação client-side + server-side',
        validator: 'validateFormValidation',
        automatable: true,
        estimatedTime: 5,
    },
    {
        id: 'forms-002',
        category: 'forms',
        priority: 'high',
        description: 'Erros de servidor exibidos corretamente',
        validator: 'validateServerErrorDisplay',
        automatable: true,
        estimatedTime: 3,
    },
    {
        id: 'forms-003',
        category: 'forms',
        priority: 'medium',
        description: 'Loading states durante submissão',
        validator: 'validateFormLoadingStates',
        automatable: true,
        estimatedTime: 2,
    },
    // BUTTONS
    {
        id: 'buttons-001',
        category: 'buttons',
        priority: 'critical',
        description: 'Todos os botões funcionam',
        validator: 'validateAllButtons',
        automatable: true,
        estimatedTime: 4,
    },
    {
        id: 'buttons-002',
        category: 'buttons',
        priority: 'high',
        description: 'Loading states em botões async',
        validator: 'validateLoadingStates',
        automatable: true,
        estimatedTime: 3,
    },
    {
        id: 'buttons-003',
        category: 'buttons',
        priority: 'medium',
        description: 'Disabled state funciona',
        validator: 'validateDisabledStates',
        automatable: true,
        estimatedTime: 2,
    },
    // CODE QUALITY
    {
        id: 'code-001',
        category: 'code',
        priority: 'critical',
        description: 'Sem imports de módulos inexistentes',
        validator: 'validateImports',
        automatable: true,
        estimatedTime: 2,
    },
    {
        id: 'code-002',
        category: 'code',
        priority: 'high',
        description: 'TypeScript strict sem erros',
        validator: 'validateTypeScript',
        automatable: true,
        estimatedTime: 3,
    },
    {
        id: 'code-003',
        category: 'code',
        priority: 'critical',
        description: 'Sem segredos hardcoded',
        validator: 'validateNoHardcodedSecrets',
        automatable: true,
        estimatedTime: 2,
    },
    {
        id: 'code-004',
        category: 'code',
        priority: 'medium',
        description: 'Sem console.log em produção',
        validator: 'validateNoConsoleLogs',
        automatable: true,
        estimatedTime: 1,
    },
    // PERFORMANCE
    {
        id: 'perf-001',
        category: 'performance',
        priority: 'high',
        description: 'Tempo de carregamento inicial <3s',
        validator: 'validateLoadTime',
        automatable: true,
        estimatedTime: 2,
    },
    {
        id: 'perf-002',
        category: 'performance',
        priority: 'medium',
        description: 'Imagens otimizadas (WebP/AVIF, lazy loading)',
        validator: 'validateImageOptimization',
        automatable: true,
        estimatedTime: 3,
    },
    // SECURITY
    {
        id: 'security-001',
        category: 'security',
        priority: 'critical',
        description: 'HTTPS ativo em produção',
        validator: 'validateHTTPS',
        automatable: true,
        estimatedTime: 1,
    },
    {
        id: 'security-002',
        category: 'security',
        priority: 'critical',
        description: 'CORS configurado corretamente',
        validator: 'validateCORS',
        automatable: true,
        estimatedTime: 2,
    },
];
// ============================================================================
// CHECKS CONDICIONAIS (ATIVADOS POR PRD)
// ============================================================================
exports.AUTH_CHECKS = [
    {
        id: 'auth-001',
        category: 'auth',
        priority: 'critical',
        description: 'Rotas protegidas redirecionam para login',
        validator: 'validateRouteProtection',
        automatable: true,
        estimatedTime: 4,
        prdTriggers: ['autenticação', 'login', 'signup', 'auth', 'sessão'],
    },
    {
        id: 'auth-002',
        category: 'auth',
        priority: 'critical',
        description: 'Passwords têm requisitos mínimos (8+ chars, complexidade)',
        validator: 'validatePasswordSecurity',
        automatable: true,
        estimatedTime: 2,
        prdTriggers: ['password', 'senha', 'autenticação'],
    },
    {
        id: 'auth-003',
        category: 'auth',
        priority: 'high',
        description: 'Session expira corretamente',
        validator: 'validateSessionExpiry',
        automatable: true,
        estimatedTime: 3,
        prdTriggers: ['sessão', 'session', 'token'],
    },
    {
        id: 'auth-004',
        category: 'auth',
        priority: 'high',
        description: 'Logout limpa session/cookies',
        validator: 'validateLogout',
        automatable: true,
        estimatedTime: 2,
        prdTriggers: ['logout', 'sair'],
    },
];
exports.PAYMENT_CHECKS = [
    {
        id: 'payment-001',
        category: 'security',
        priority: 'critical',
        description: 'Integração Stripe/PayPal em modo produção',
        validator: 'validatePaymentIntegration',
        automatable: false,
        estimatedTime: 10,
        prdTriggers: ['pagamento', 'stripe', 'paypal', 'checkout', 'compra'],
    },
    {
        id: 'payment-002',
        category: 'security',
        priority: 'critical',
        description: 'Webhooks de pagamento funcionam',
        validator: 'validatePaymentWebhooks',
        automatable: false,
        estimatedTime: 5,
        prdTriggers: ['webhook', 'pagamento'],
    },
    {
        id: 'payment-003',
        category: 'security',
        priority: 'high',
        description: 'Erros de pagamento exibidos ao utilizador',
        validator: 'validatePaymentErrors',
        automatable: true,
        estimatedTime: 3,
        prdTriggers: ['pagamento', 'erro'],
    },
];
exports.REALTIME_CHECKS = [
    {
        id: 'realtime-001',
        category: 'performance',
        priority: 'critical',
        description: 'WebSocket/Supabase Realtime conecta',
        validator: 'validateRealtimeConnection',
        automatable: true,
        estimatedTime: 4,
        prdTriggers: ['realtime', 'websocket', 'tempo real', 'live'],
    },
    {
        id: 'realtime-002',
        category: 'performance',
        priority: 'high',
        description: 'Atualizações em tempo real sincronizam corretamente',
        validator: 'validateRealtimeSync',
        automatable: true,
        estimatedTime: 5,
        prdTriggers: ['realtime', 'sincronizar'],
    },
    {
        id: 'realtime-003',
        category: 'performance',
        priority: 'medium',
        description: 'Reconnect automático funciona',
        validator: 'validateRealtimeReconnect',
        automatable: true,
        estimatedTime: 3,
        prdTriggers: ['realtime', 'reconnect'],
    },
];
exports.FILE_UPLOAD_CHECKS = [
    {
        id: 'file-001',
        category: 'security',
        priority: 'critical',
        description: 'Upload de ficheiros funciona (Supabase Storage/S3)',
        validator: 'validateFileUpload',
        automatable: true,
        estimatedTime: 4,
        prdTriggers: ['upload', 'ficheiro', 'imagem', 'storage'],
    },
    {
        id: 'file-002',
        category: 'security',
        priority: 'high',
        description: 'Validação de tipo/tamanho de ficheiro',
        validator: 'validateFileValidation',
        automatable: true,
        estimatedTime: 3,
        prdTriggers: ['upload', 'validação'],
    },
    {
        id: 'file-003',
        category: 'security',
        priority: 'critical',
        description: 'URLs de ficheiros expiram/são protegidos',
        validator: 'validateFileAccess',
        automatable: true,
        estimatedTime: 2,
        prdTriggers: ['storage', 'segurança'],
    },
];
exports.EMAIL_CHECKS = [
    {
        id: 'email-001',
        category: 'code',
        priority: 'high',
        description: 'Emails enviados via Resend/SendGrid',
        validator: 'validateEmailSending',
        automatable: false,
        estimatedTime: 5,
        prdTriggers: ['email', 'notificação', 'resend'],
    },
    {
        id: 'email-002',
        category: 'code',
        priority: 'medium',
        description: 'Templates de email renderizam corretamente',
        validator: 'validateEmailTemplates',
        automatable: true,
        estimatedTime: 3,
        prdTriggers: ['email', 'template'],
    },
];
// ============================================================================
// PRD ANALYSIS
// ============================================================================
function analyzePRD(prd) {
    const lowerPRD = prd.toLowerCase();
    const analysis = {
        hasAuth: false,
        hasPayments: false,
        hasRealtime: false,
        hasFileUpload: false,
        hasEmailNotifications: false,
        hasComplexForms: false,
        hasDataVisualization: false,
        hasMobileRequirements: false,
        hasAPIIntegrations: false,
        hasMultiLanguage: false,
        detectKeywords: [],
    };
    // AUTH
    const authKeywords = ['autenticação', 'login', 'signup', 'auth', 'sessão', 'password'];
    if (authKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasAuth = true;
        analysis.detectKeywords.push('auth');
    }
    // PAYMENTS
    const paymentKeywords = ['pagamento', 'stripe', 'paypal', 'checkout', 'compra', 'subscrição'];
    if (paymentKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasPayments = true;
        analysis.detectKeywords.push('payments');
    }
    // REALTIME
    const realtimeKeywords = ['realtime', 'tempo real', 'websocket', 'live', 'sincronização'];
    if (realtimeKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasRealtime = true;
        analysis.detectKeywords.push('realtime');
    }
    // FILE UPLOAD
    const fileKeywords = ['upload', 'ficheiro', 'imagem', 'storage', 'anexo'];
    if (fileKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasFileUpload = true;
        analysis.detectKeywords.push('file-upload');
    }
    // EMAIL
    const emailKeywords = ['email', 'notificação', 'resend', 'sendgrid'];
    if (emailKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasEmailNotifications = true;
        analysis.detectKeywords.push('email');
    }
    // COMPLEX FORMS
    const formKeywords = ['formulário', 'form', 'validação', 'input', 'submissão'];
    const formCount = formKeywords.filter(k => lowerPRD.includes(k)).length;
    if (formCount >= 2) {
        analysis.hasComplexForms = true;
        analysis.detectKeywords.push('complex-forms');
    }
    // DATA VISUALIZATION
    const vizKeywords = ['gráfico', 'chart', 'dashboard', 'visualização', 'analytics'];
    if (vizKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasDataVisualization = true;
        analysis.detectKeywords.push('data-viz');
    }
    // MOBILE
    const mobileKeywords = ['mobile', 'responsivo', 'smartphone', 'tablet', 'app'];
    if (mobileKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasMobileRequirements = true;
        analysis.detectKeywords.push('mobile');
    }
    // API INTEGRATIONS
    const apiKeywords = ['api', 'integração', 'third-party', 'webhook'];
    if (apiKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasAPIIntegrations = true;
        analysis.detectKeywords.push('api');
    }
    // MULTI-LANGUAGE
    const i18nKeywords = ['multi-idioma', 'i18n', 'tradução', 'internacionalização'];
    if (i18nKeywords.some(k => lowerPRD.includes(k))) {
        analysis.hasMultiLanguage = true;
        analysis.detectKeywords.push('i18n');
    }
    return analysis;
}
// ============================================================================
// ADAPTIVE CHECKLIST GENERATION
// ============================================================================
function generateAdaptiveChecklist(prd) {
    const analysis = analyzePRD(prd);
    const checklist = [...exports.UNIVERSAL_CHECKS];
    if (analysis.hasAuth) {
        checklist.push(...exports.AUTH_CHECKS);
    }
    if (analysis.hasPayments) {
        checklist.push(...exports.PAYMENT_CHECKS);
    }
    if (analysis.hasRealtime) {
        checklist.push(...exports.REALTIME_CHECKS);
    }
    if (analysis.hasFileUpload) {
        checklist.push(...exports.FILE_UPLOAD_CHECKS);
    }
    if (analysis.hasEmailNotifications) {
        checklist.push(...exports.EMAIL_CHECKS);
    }
    // Sort por prioridade
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    checklist.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return checklist;
}
// ============================================================================
// QA SCORE CALCULATION
// ============================================================================
const SEVERITY_WEIGHTS = {
    CRITICAL: 25,
    HIGH: 10,
    MEDIUM: 3,
    LOW: 1,
};
function calculateQAScore(bugs) {
    const breakdown = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
    };
    let deductions = 0;
    const blockers = [];
    for (const bug of bugs) {
        const weight = SEVERITY_WEIGHTS[bug.severity];
        deductions += weight;
        breakdown[bug.severity.toLowerCase()]++;
        if (bug.severity === 'CRITICAL') {
            blockers.push(bug);
        }
    }
    const maxPossible = 100;
    const total = Math.max(0, maxPossible - deductions);
    const percentage = (total / maxPossible) * 100;
    return {
        total,
        maxPossible,
        percentage: Math.round(percentage * 10) / 10,
        breakdown,
        passed: 0, // será preenchido pelo executor
        failed: bugs.length,
        blockers,
    };
}
// ============================================================================
// BROWSER INITIALIZATION
// ============================================================================
async function initBrowser(headless = true) {
    return await playwright_1.chromium.launch({
        headless,
        args: ['--disable-dev-shm-usage'],
    });
}
// ============================================================================
// UTILITIES
// ============================================================================
function estimateTotalTime(checklist) {
    return checklist.reduce((acc, check) => acc + check.estimatedTime, 0);
}
function groupChecksByCategory(checklist) {
    return checklist.reduce((acc, check) => {
        if (!acc[check.category]) {
            acc[check.category] = [];
        }
        acc[check.category].push(check);
        return acc;
    }, {});
}
function getAutomatableChecks(checklist) {
    return checklist.filter(c => c.automatable);
}
function getCriticalChecks(checklist) {
    return checklist.filter(c => c.priority === 'critical');
}
