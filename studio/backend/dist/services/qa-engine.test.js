/**
 * DevForge V2 - QA Engine Tests
 * Testes unitários para validar funcionamento do motor de QA
 */
import { describe, test, expect } from '@jest/globals';
import { analyzePRD, generateAdaptiveChecklist, calculateQAScore, estimateTotalTime, groupChecksByCategory, getAutomatableChecks, getCriticalChecks, UNIVERSAL_CHECKS, AUTH_CHECKS, PAYMENT_CHECKS, REALTIME_CHECKS, } from './qa-engine';
// ============================================================================
// PRD ANALYSIS TESTS
// ============================================================================
describe('analyzePRD', () => {
    test('detecta autenticação', () => {
        const prd = 'Sistema com login e signup de utilizadores';
        const analysis = analyzePRD(prd);
        expect(analysis.hasAuth).toBe(true);
        expect(analysis.detectKeywords).toContain('auth');
    });
    test('detecta pagamentos', () => {
        const prd = 'E-commerce com checkout via Stripe';
        const analysis = analyzePRD(prd);
        expect(analysis.hasPayments).toBe(true);
        expect(analysis.detectKeywords).toContain('payments');
    });
    test('detecta realtime', () => {
        const prd = 'Chat em tempo real com websockets';
        const analysis = analyzePRD(prd);
        expect(analysis.hasRealtime).toBe(true);
        expect(analysis.detectKeywords).toContain('realtime');
    });
    test('detecta file upload', () => {
        const prd = 'Upload de imagens para Supabase Storage';
        const analysis = analyzePRD(prd);
        expect(analysis.hasFileUpload).toBe(true);
        expect(analysis.detectKeywords).toContain('file-upload');
    });
    test('detecta email', () => {
        const prd = 'Notificações por email via Resend';
        const analysis = analyzePRD(prd);
        expect(analysis.hasEmailNotifications).toBe(true);
        expect(analysis.detectKeywords).toContain('email');
    });
    test('detecta mobile', () => {
        const prd = 'App responsivo mobile-first';
        const analysis = analyzePRD(prd);
        expect(analysis.hasMobileRequirements).toBe(true);
        expect(analysis.detectKeywords).toContain('mobile');
    });
    test('não detecta features inexistentes', () => {
        const prd = 'Landing page simples com formulário de contacto';
        const analysis = analyzePRD(prd);
        expect(analysis.hasAuth).toBe(false);
        expect(analysis.hasPayments).toBe(false);
        expect(analysis.hasRealtime).toBe(false);
    });
});
// ============================================================================
// CHECKLIST GENERATION TESTS
// ============================================================================
describe('generateAdaptiveChecklist', () => {
    test('gera checklist mínima para projeto simples', () => {
        const prd = 'Landing page estática';
        const checklist = generateAdaptiveChecklist(prd);
        expect(checklist.length).toBeGreaterThanOrEqual(UNIVERSAL_CHECKS.length);
    });
    test('adiciona checks de auth quando necessário', () => {
        const prd = 'Sistema com autenticação e login';
        const checklist = generateAdaptiveChecklist(prd);
        const authCheckIds = AUTH_CHECKS.map(c => c.id);
        const hasAuthChecks = checklist.some(c => authCheckIds.includes(c.id));
        expect(hasAuthChecks).toBe(true);
    });
    test('adiciona checks de payment quando necessário', () => {
        const prd = 'E-commerce com Stripe';
        const checklist = generateAdaptiveChecklist(prd);
        const paymentCheckIds = PAYMENT_CHECKS.map(c => c.id);
        const hasPaymentChecks = checklist.some(c => paymentCheckIds.includes(c.id));
        expect(hasPaymentChecks).toBe(true);
    });
    test('adiciona checks de realtime quando necessário', () => {
        const prd = 'Chat em tempo real';
        const checklist = generateAdaptiveChecklist(prd);
        const realtimeCheckIds = REALTIME_CHECKS.map(c => c.id);
        const hasRealtimeChecks = checklist.some(c => realtimeCheckIds.includes(c.id));
        expect(hasRealtimeChecks).toBe(true);
    });
    test('prioriza checks críticos primeiro', () => {
        const prd = 'Sistema completo com auth e payments';
        const checklist = generateAdaptiveChecklist(prd);
        const firstCheck = checklist[0];
        expect(firstCheck.priority).toBe('critical');
    });
    test('não duplica checks', () => {
        const prd = 'Sistema com auth auth auth';
        const checklist = generateAdaptiveChecklist(prd);
        const checkIds = checklist.map(c => c.id);
        const uniqueIds = new Set(checkIds);
        expect(checkIds.length).toBe(uniqueIds.size);
    });
});
// ============================================================================
// QA SCORE TESTS
// ============================================================================
describe('calculateQAScore', () => {
    test('score perfeito sem bugs', () => {
        const bugs = [];
        const score = calculateQAScore(bugs);
        expect(score.total).toBe(100);
        expect(score.percentage).toBe(100);
        expect(score.blockers).toHaveLength(0);
    });
    test('deduz 25 pontos por bug CRITICAL', () => {
        const bugs = [
            {
                id: 'bug-1',
                checkId: 'test-001',
                severity: 'CRITICAL',
                title: 'Deploy falhou',
                description: 'App não carrega',
                reproducible: true,
                foundAt: new Date(),
            },
        ];
        const score = calculateQAScore(bugs);
        expect(score.total).toBe(75);
        expect(score.breakdown.critical).toBe(1);
        expect(score.blockers).toHaveLength(1);
    });
    test('deduz 10 pontos por bug HIGH', () => {
        const bugs = [
            {
                id: 'bug-1',
                checkId: 'test-001',
                severity: 'HIGH',
                title: 'Validação não funciona',
                description: 'Forms aceitam dados inválidos',
                reproducible: true,
                foundAt: new Date(),
            },
        ];
        const score = calculateQAScore(bugs);
        expect(score.total).toBe(90);
        expect(score.breakdown.high).toBe(1);
    });
    test('deduz 3 pontos por bug MEDIUM', () => {
        const bugs = [
            {
                id: 'bug-1',
                checkId: 'test-001',
                severity: 'MEDIUM',
                title: 'Loading state ausente',
                description: 'Botão não mostra loading',
                reproducible: true,
                foundAt: new Date(),
            },
        ];
        const score = calculateQAScore(bugs);
        expect(score.total).toBe(97);
        expect(score.breakdown.medium).toBe(1);
    });
    test('deduz 1 ponto por bug LOW', () => {
        const bugs = [
            {
                id: 'bug-1',
                checkId: 'test-001',
                severity: 'LOW',
                title: 'Console.log em produção',
                description: 'Alguns console.log encontrados',
                reproducible: true,
                foundAt: new Date(),
            },
        ];
        const score = calculateQAScore(bugs);
        expect(score.total).toBe(99);
        expect(score.breakdown.low).toBe(1);
    });
    test('score não fica negativo', () => {
        const bugs = Array(10).fill(null).map((_, i) => ({
            id: `bug-${i}`,
            checkId: 'test-001',
            severity: 'CRITICAL',
            title: 'Bug crítico',
            description: 'Descrição',
            reproducible: true,
            foundAt: new Date(),
        }));
        const score = calculateQAScore(bugs);
        expect(score.total).toBeGreaterThanOrEqual(0);
    });
    test('calcula breakdown corretamente', () => {
        const bugs = [
            { id: '1', checkId: 't', severity: 'CRITICAL', title: '', description: '', reproducible: true, foundAt: new Date() },
            { id: '2', checkId: 't', severity: 'CRITICAL', title: '', description: '', reproducible: true, foundAt: new Date() },
            { id: '3', checkId: 't', severity: 'HIGH', title: '', description: '', reproducible: true, foundAt: new Date() },
            { id: '4', checkId: 't', severity: 'MEDIUM', title: '', description: '', reproducible: true, foundAt: new Date() },
            { id: '5', checkId: 't', severity: 'LOW', title: '', description: '', reproducible: true, foundAt: new Date() },
        ];
        const score = calculateQAScore(bugs);
        expect(score.breakdown.critical).toBe(2);
        expect(score.breakdown.high).toBe(1);
        expect(score.breakdown.medium).toBe(1);
        expect(score.breakdown.low).toBe(1);
    });
});
// ============================================================================
// UTILITY TESTS
// ============================================================================
describe('estimateTotalTime', () => {
    test('calcula tempo total corretamente', () => {
        const checklist = [
            { id: '1', estimatedTime: 5 },
            { id: '2', estimatedTime: 3 },
            { id: '3', estimatedTime: 2 },
        ];
        const total = estimateTotalTime(checklist);
        expect(total).toBe(10);
    });
    test('retorna 0 para checklist vazia', () => {
        const total = estimateTotalTime([]);
        expect(total).toBe(0);
    });
});
describe('groupChecksByCategory', () => {
    test('agrupa checks por categoria', () => {
        const checklist = [
            { id: '1', category: 'deploy' },
            { id: '2', category: 'deploy' },
            { id: '3', category: 'auth' },
        ];
        const grouped = groupChecksByCategory(checklist);
        expect(grouped.deploy).toHaveLength(2);
        expect(grouped.auth).toHaveLength(1);
    });
    test('retorna objeto vazio para checklist vazia', () => {
        const grouped = groupChecksByCategory([]);
        expect(Object.keys(grouped)).toHaveLength(0);
    });
});
describe('getAutomatableChecks', () => {
    test('filtra apenas checks automatizáveis', () => {
        const checklist = [
            { id: '1', automatable: true },
            { id: '2', automatable: false },
            { id: '3', automatable: true },
        ];
        const automatable = getAutomatableChecks(checklist);
        expect(automatable).toHaveLength(2);
        expect(automatable.every(c => c.automatable)).toBe(true);
    });
});
describe('getCriticalChecks', () => {
    test('filtra apenas checks críticos', () => {
        const checklist = [
            { id: '1', priority: 'critical' },
            { id: '2', priority: 'high' },
            { id: '3', priority: 'critical' },
        ];
        const critical = getCriticalChecks(checklist);
        expect(critical).toHaveLength(2);
        expect(critical.every(c => c.priority === 'critical')).toBe(true);
    });
});
// ============================================================================
// INTEGRATION TESTS
// ============================================================================
describe('Integration: PRD to Score', () => {
    test('fluxo completo: PRD simples → checklist → score', () => {
        const prd = 'Landing page com formulário de contacto';
        // 1. Analisar PRD
        const analysis = analyzePRD(prd);
        expect(analysis).toBeDefined();
        // 2. Gerar checklist
        const checklist = generateAdaptiveChecklist(prd);
        expect(checklist.length).toBeGreaterThan(0);
        // 3. Simular execução com alguns bugs
        const bugs = [
            {
                id: 'bug-1',
                checkId: 'responsive-001',
                severity: 'HIGH',
                title: 'Overflow horizontal em mobile',
                description: 'Página tem 420px mas viewport é 375px',
                reproducible: true,
                foundAt: new Date(),
            },
        ];
        // 4. Calcular score
        const score = calculateQAScore(bugs);
        expect(score.total).toBe(90); // 100 - 10 (HIGH)
        expect(score.percentage).toBe(90);
    });
    test('fluxo completo: PRD complexo → checklist expandida', () => {
        const prd = `
      Sistema completo com:
      - Autenticação (login/signup)
      - Pagamentos via Stripe
      - Chat em tempo real
      - Upload de ficheiros
      - Notificações por email
    `;
        const checklist = generateAdaptiveChecklist(prd);
        // Deve incluir checks de todas as features
        const categories = new Set(checklist.map(c => c.category));
        expect(categories.has('deploy')).toBe(true);
        expect(categories.has('auth')).toBe(true);
        // Mais categorias...
        expect(checklist.length).toBeGreaterThan(UNIVERSAL_CHECKS.length + AUTH_CHECKS.length);
    });
});
