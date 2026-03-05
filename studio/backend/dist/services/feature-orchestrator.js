"use strict";
/**
 * FEATURE ORCHESTRATOR — Pipeline para Features (FASE 4)
 *
 * Pipeline de 6 fases para cada Feature:
 * 1. PM Agent       → Claude (gerar acceptance criteria detalhados)
 * 2. Architect      → Ollama (gerar plano técnico)
 * 3. Dev Team       → 4 agentes Ollama PARALELO
 *    - Frontend Dev
 *    - Backend Dev
 *    - Database Dev
 *    - Utils Dev
 * 4. QA Agent       → Playwright + validators
 * 5. Fix Loop       → Ollama (até 10 iterações ou QA >= 95)
 * 6. Deploy         → Vercel + Railway
 *
 * Branch Isolation: feat/{featureId}
 * WebSocket Streaming: PHASE_CHANGED, LOG_APPENDED, FEATURE_UPDATED
 * DB Updates: agentProgress, status, logs, bugs, qaScore
 */
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
exports.FeaturePipeline = void 0;
exports.runFeaturePipeline = runFeaturePipeline;
const client_1 = require("@prisma/client");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const architect_1 = require("./architect");
const dev_team_1 = require("./dev-team");
const qa_executor_1 = require("./qa-executor");
const bug_fix_loop_1 = require("./bug-fix-loop");
const prisma = new client_1.PrismaClient();
// ============================================================================
// FEATURE PIPELINE CLASS
// ============================================================================
class FeaturePipeline {
    config;
    phases = [];
    startTime = 0;
    wsCallback;
    claudeClient;
    constructor(config) {
        this.config = {
            ollamaEndpoint: config.ollamaEndpoint || 'http://localhost:11434',
            ollamaModel: config.ollamaModel || 'qwen2.5-coder:32b',
            outputDirectory: config.outputDirectory || './generated-projects',
            autoFix: config.autoFix ?? true,
            maxFixIterations: config.maxFixIterations || 10,
            targetQAScore: config.targetQAScore || 95,
            ...config
        };
        this.claudeClient = new sdk_1.default({ apiKey: this.config.claudeApiKey });
    }
    /**
     * Registar callback para WebSocket events
     */
    onWebSocketEvent(callback) {
        this.wsCallback = callback;
    }
    /**
     * Setup WebSocket broadcasting automático
     */
    setupWebSocketBroadcasting() {
        // Importar broadcast function
        Promise.resolve().then(() => __importStar(require('../lib/websocket.js'))).then(({ broadcastToFeature }) => {
            this.onWebSocketEvent((event) => {
                broadcastToFeature(this.config.featureId, event);
            });
        }).catch((error) => {
            console.error('[FeaturePipeline] Failed to setup WebSocket:', error);
        });
    }
    /**
     * Executar pipeline completo para uma Feature
     */
    async run() {
        this.startTime = Date.now();
        // Setup WebSocket broadcasting
        this.setupWebSocketBroadcasting();
        try {
            // Carregar feature da DB
            const feature = await prisma.feature.findUnique({
                where: { id: this.config.featureId },
                include: {
                    project: {
                        include: {
                            messages: true
                        }
                    },
                    requestedBy: true
                }
            });
            if (!feature) {
                throw new Error(`Feature ${this.config.featureId} não encontrada`);
            }
            const project = feature.project;
            // Verificar se project tem PRD
            if (!project.prd) {
                throw new Error('Project não tem PRD gerado. Execute PM Agent primeiro.');
            }
            this.log('INFO', `🚀 Pipeline iniciado para Feature "${feature.title}"`, 'PM');
            this.emitPhaseChange('PM');
            // Update status inicial
            await this.updateFeatureStatus('IN_PROGRESS', 0);
            // ========================================================================
            // FASE 1: PM AGENT — Gerar Acceptance Criteria detalhados
            // ========================================================================
            await this.startPhase('PM');
            this.log('INFO', '📋 PM Agent a gerar acceptance criteria...', 'PM');
            const acceptanceCriteria = await this.generateAcceptanceCriteria(feature, project.prd);
            this.log('SUCCESS', `✅ ${acceptanceCriteria.length} acceptance criteria gerados`, 'PM');
            await this.completePhase('PM', { acceptanceCriteria });
            // Guardar acceptance criteria na DB
            await prisma.feature.update({
                where: { id: this.config.featureId },
                data: { acceptanceCriteria: JSON.stringify(acceptanceCriteria) }
            });
            await this.updateFeatureProgress(15);
            // ========================================================================
            // FASE 2: ARCHITECT AGENT — Gerar Plano Técnico
            // ========================================================================
            await this.startPhase('ARCHITECT');
            this.emitPhaseChange('ARCHITECT');
            this.log('INFO', '🏗️  Architect Agent a gerar plano técnico...', 'ARCHITECT');
            const architectAgent = new architect_1.ArchitectAgent();
            const technicalPlan = await architectAgent.generateFeaturePlan(feature, acceptanceCriteria, project.architecture);
            this.log('SUCCESS', '✅ Plano técnico gerado', 'ARCHITECT');
            await this.completePhase('ARCHITECT', { technicalPlan });
            // Guardar technical plan na DB
            await prisma.feature.update({
                where: { id: this.config.featureId },
                data: { technicalPlan: technicalPlan }
            });
            await this.updateFeatureProgress(30);
            // ========================================================================
            // BRANCH ISOLATION — Criar branch feat/{featureId}
            // ========================================================================
            const branchName = `feat/${this.config.featureId}`;
            const outputPath = (0, path_1.join)(this.config.outputDirectory, this.config.projectId);
            if (!(0, fs_1.existsSync)(outputPath)) {
                throw new Error(`Output path não existe: ${outputPath}`);
            }
            this.log('INFO', `🌿 A criar branch: ${branchName}`, 'ARCHITECT');
            try {
                // Criar branch
                (0, child_process_1.execSync)(`git checkout -b ${branchName}`, { cwd: outputPath });
                // Guardar branch na DB
                await prisma.feature.update({
                    where: { id: this.config.featureId },
                    data: { branchName }
                });
                this.log('SUCCESS', `✅ Branch criada: ${branchName}`, 'ARCHITECT');
            }
            catch (error) {
                this.log('WARN', `⚠️  Erro ao criar branch (pode já existir): ${error}`, 'ARCHITECT');
            }
            await this.updateFeatureProgress(35);
            // ========================================================================
            // FASE 3: DEV TEAM — 4 Agentes Paralelo
            // ========================================================================
            await this.startPhase('DEV_TEAM');
            this.emitPhaseChange('DEV_TEAM');
            this.log('INFO', '👨‍💻 Dev Team a gerar código (4 agentes em paralelo)...', 'DEV_TEAM');
            const devTeam = new dev_team_1.DevTeam();
            const codeResult = await devTeam.executeFeature({
                feature,
                technicalPlan,
                architecture: project.architecture,
                projectPath: outputPath
            });
            this.log('SUCCESS', `✅ Código gerado (${codeResult.stats.successful}/${codeResult.stats.total} ficheiros)`, 'DEV_TEAM');
            await this.completePhase('DEV_TEAM', { codeResult });
            await this.updateFeatureProgress(60);
            // ========================================================================
            // FASE 4: QA AGENT — Playwright + Validators
            // ========================================================================
            await this.startPhase('QA');
            this.emitPhaseChange('QA');
            this.log('INFO', '🔍 QA Agent a executar validações...', 'QA');
            const qaResults = await (0, qa_executor_1.executeQA)({
                prd: JSON.stringify(project.prd),
                projectPath: outputPath,
                headless: true,
                autoFix: false, // Fix na próxima fase
                claudeApiKey: this.config.claudeApiKey,
                ollamaEndpoint: this.config.ollamaEndpoint,
                featureId: this.config.featureId,
                acceptanceCriteria
            });
            const qaScore = qaResults.score.percentage;
            this.log('INFO', `QA Score: ${qaScore}% (${qaResults.score.passed}/${qaResults.score.passed + qaResults.score.failed} checks)`, 'QA');
            if (qaResults.allBugs.length > 0) {
                this.log('WARN', `⚠️  ${qaResults.allBugs.length} bug(s) encontrado(s)`, 'QA');
            }
            else {
                this.log('SUCCESS', '✅ Nenhum bug encontrado!', 'QA');
            }
            await this.completePhase('QA', { qaResults });
            // Guardar QA report na DB
            await prisma.feature.update({
                where: { id: this.config.featureId },
                data: {
                    qaScore,
                    bugs: JSON.stringify(qaResults.allBugs)
                }
            });
            await this.updateFeatureProgress(75);
            // ========================================================================
            // FASE 5: FIX LOOP — Até 10 iterações ou QA >= 95
            // ========================================================================
            let finalQAScore = qaScore;
            let iteration = 0;
            if (this.config.autoFix && qaResults.allBugs.length > 0 && qaScore < this.config.targetQAScore) {
                await this.startPhase('FIX_LOOP');
                this.emitPhaseChange('FIX_LOOP');
                while (iteration < this.config.maxFixIterations && finalQAScore < this.config.targetQAScore) {
                    iteration++;
                    this.log('INFO', `🔧 Fix Loop iteração ${iteration}/${this.config.maxFixIterations} (QA: ${finalQAScore}%)`, 'FIX_LOOP');
                    const bugFixResults = await (0, bug_fix_loop_1.runBatchBugFix)(qaResults.allBugs, qaResults.checklist, {
                        maxIterations: 1,
                        ollamaModel: this.config.ollamaModel,
                        ollamaEndpoint: this.config.ollamaEndpoint,
                        claudeApiKey: this.config.claudeApiKey,
                        projectPath: outputPath,
                        browser: await (await Promise.resolve().then(() => __importStar(require('playwright')))).chromium.launch({ headless: true })
                    });
                    const fixed = bugFixResults.filter((r) => r.fixed).length;
                    this.log('INFO', `✅ ${fixed}/${qaResults.allBugs.length} bugs corrigidos nesta iteração`, 'FIX_LOOP');
                    // Re-executar QA
                    const newQAResults = await (0, qa_executor_1.executeQA)({
                        prd: JSON.stringify(project.prd),
                        projectPath: outputPath,
                        headless: true,
                        autoFix: false,
                        claudeApiKey: this.config.claudeApiKey,
                        ollamaEndpoint: this.config.ollamaEndpoint,
                        featureId: this.config.featureId,
                        acceptanceCriteria
                    });
                    finalQAScore = newQAResults.score.percentage;
                    // Atualizar DB
                    await prisma.feature.update({
                        where: { id: this.config.featureId },
                        data: {
                            qaScore: finalQAScore,
                            bugs: JSON.stringify(newQAResults.allBugs)
                        }
                    });
                    if (finalQAScore >= this.config.targetQAScore) {
                        this.log('SUCCESS', `✅ QA Score atingido: ${finalQAScore}%`, 'FIX_LOOP');
                        break;
                    }
                    if (iteration >= this.config.maxFixIterations) {
                        this.log('WARN', `⚠️  Max iterações atingido (${this.config.maxFixIterations}). QA final: ${finalQAScore}%`, 'FIX_LOOP');
                    }
                }
                await this.completePhase('FIX_LOOP', { iterations: iteration, finalQAScore });
            }
            else {
                this.log('INFO', '⏭️  Fix Loop ignorado (autoFix desativo ou QA >= 95%)', 'FIX_LOOP');
            }
            await this.updateFeatureProgress(90);
            // ========================================================================
            // FASE 6: DEPLOY — Commit & Push (Merge manual)
            // ========================================================================
            await this.startPhase('DEPLOY');
            this.emitPhaseChange('DEPLOY');
            this.log('INFO', '📦 A fazer commit das alterações...', 'DEPLOY');
            try {
                // Git add
                (0, child_process_1.execSync)('git add .', { cwd: outputPath });
                // Git commit
                const commitMessage = `feat: ${feature.title}\n\n${feature.description}\n\nQA Score: ${finalQAScore}%`;
                (0, child_process_1.execSync)(`git commit -m "${commitMessage}"`, { cwd: outputPath });
                // Git push
                (0, child_process_1.execSync)(`git push -u origin ${branchName}`, { cwd: outputPath });
                this.log('SUCCESS', `✅ Commit & push concluído: ${branchName}`, 'DEPLOY');
            }
            catch (error) {
                this.log('WARN', `⚠️  Erro no deploy: ${error}`, 'DEPLOY');
            }
            await this.completePhase('DEPLOY', { branch: branchName });
            // ========================================================================
            // FINALIZAR
            // ========================================================================
            const finalStatus = finalQAScore >= this.config.targetQAScore ? 'IN_REVIEW' : 'BLOCKED';
            await this.updateFeatureStatus(finalStatus, 100);
            const totalTime = Date.now() - this.startTime;
            this.log('SUCCESS', `🎉 Feature pipeline completo em ${(totalTime / 1000 / 60).toFixed(1)} minutos!`, 'DEPLOY');
            // Activity log
            await prisma.activityLog.create({
                data: {
                    projectId: this.config.projectId,
                    featureId: this.config.featureId,
                    actorName: 'DevForge AI',
                    actorType: 'AI',
                    action: 'FEATURE_COMPLETED',
                    metadata: JSON.stringify({
                        qaScore: finalQAScore,
                        branch: branchName,
                        totalTime: Math.ceil(totalTime / 1000 / 60)
                    })
                }
            });
            return {
                success: true,
                featureId: this.config.featureId,
                finalStatus,
                qaScore: finalQAScore,
                branch: branchName,
                phases: this.phases,
                totalTime
            };
        }
        catch (error) {
            this.log('ERROR', `💥 Pipeline falhou: ${error instanceof Error ? error.message : String(error)}`, 'ERROR');
            await this.updateFeatureStatus('BLOCKED', 0);
            return {
                success: false,
                featureId: this.config.featureId,
                finalStatus: 'BLOCKED',
                qaScore: 0,
                branch: '',
                phases: this.phases,
                totalTime: Date.now() - this.startTime,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * FASE 1: Gerar Acceptance Criteria com Claude
     */
    async generateAcceptanceCriteria(feature, prd) {
        const prompt = `Você é um Product Manager experiente. Dado o contexto do projeto e uma feature, gere acceptance criteria detalhados.

**PRD do Projeto:**
${JSON.stringify(prd, null, 2)}

**Feature:**
- **Título:** ${feature.title}
- **Descrição:** ${feature.description}
- **Tipo:** ${feature.type}
- **Prioridade:** ${feature.priority}

**Tarefa:**
Gere entre 5 e 10 acceptance criteria claros e testáveis para esta feature.

**Formato de Output (JSON):**
[
  "Critério 1 (Given-When-Then format)",
  "Critério 2 (Given-When-Then format)",
  ...
]

Regras:
- Use formato Given-When-Then
- Seja específico e testável
- Cubra casos normais e edge cases
- Foque no comportamento do utilizador`;
        const response = await this.claudeClient.messages.create({
            model: 'claude-opus-4-6',
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }]
        });
        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Claude response não é texto');
        }
        // Parse JSON
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Claude response não contém JSON válido');
        }
        return JSON.parse(jsonMatch[0]);
    }
    /**
     * Update Feature status e progress
     */
    async updateFeatureStatus(status, progress) {
        await prisma.feature.update({
            where: { id: this.config.featureId },
            data: {
                status,
                agentProgress: progress
            }
        });
        this.emitFeatureUpdate(status, progress);
    }
    /**
     * Update Feature progress
     */
    async updateFeatureProgress(progress) {
        await prisma.feature.update({
            where: { id: this.config.featureId },
            data: { agentProgress: progress }
        });
        this.emitFeatureUpdate(undefined, progress);
    }
    /**
     * Iniciar nova fase
     */
    async startPhase(phase) {
        const phaseResult = {
            phase,
            status: 'RUNNING',
            startTime: new Date()
        };
        this.phases.push(phaseResult);
    }
    /**
     * Completar fase actual
     */
    async completePhase(phase, output) {
        const phaseResult = this.phases.find((p) => p.phase === phase && !p.endTime);
        if (phaseResult) {
            phaseResult.status = 'DONE';
            phaseResult.endTime = new Date();
            phaseResult.duration = phaseResult.endTime.getTime() - phaseResult.startTime.getTime();
            phaseResult.output = output;
        }
    }
    /**
     * Logging helper
     */
    log(level, message, phase) {
        const log = {
            timestamp: new Date(),
            level,
            message,
            phase
        };
        // Emit WebSocket event
        this.emitLog(log);
        // Append to Feature logs in DB
        prisma.feature
            .findUnique({ where: { id: this.config.featureId } })
            .then((feature) => {
            if (feature) {
                const logs = JSON.parse(feature.logs || '[]');
                logs.push(log);
                return prisma.feature.update({
                    where: { id: this.config.featureId },
                    data: { logs: JSON.stringify(logs) }
                });
            }
        })
            .catch((err) => console.error('Erro ao guardar log:', err));
        // Console log
        const icon = {
            DEBUG: '🔍',
            INFO: 'ℹ️',
            WARN: '⚠️',
            ERROR: '❌',
            SUCCESS: '✅'
        }[level];
        console.log(`${icon} [${phase}] ${message}`);
    }
    /**
     * Emit WebSocket events
     */
    emitPhaseChange(phase) {
        if (this.wsCallback) {
            this.wsCallback({
                type: 'PHASE_CHANGED',
                data: { featureId: this.config.featureId, phase }
            });
        }
    }
    emitLog(log) {
        if (this.wsCallback) {
            this.wsCallback({
                type: 'LOG_APPENDED',
                data: { featureId: this.config.featureId, log }
            });
        }
    }
    emitFeatureUpdate(status, progress) {
        if (this.wsCallback) {
            this.wsCallback({
                type: 'FEATURE_UPDATED',
                data: {
                    featureId: this.config.featureId,
                    status,
                    progress
                }
            });
        }
    }
}
exports.FeaturePipeline = FeaturePipeline;
// ============================================================================
// HELPER FUNCTION
// ============================================================================
/**
 * Helper para executar pipeline standalone
 */
async function runFeaturePipeline(config) {
    const pipeline = new FeaturePipeline(config);
    return pipeline.run();
}
