"use strict";
/**
 * ORCHESTRATOR — Pipeline Principal DevForge V2
 *
 * Executa 6 etapas em sequência:
 * 1. PM Agent (já executado, usa PRD)
 * 2. Architect Agent
 * 3. Dev Team (4 devs paralelo)
 * 4. QA Pipeline
 * 5. Bug Fix Loop (se necessário)
 * 6. Delivery Agent
 *
 * Logging via SSE broadcast
 * Update Project status na DB
 * Save artifacts
 * Error handling com rollback
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pipeline = void 0;
exports.runPipeline = runPipeline;
const client_1 = require("@prisma/client");
const architect_1 = require("./architect");
const dev_team_1 = require("./dev-team");
const qa_executor_1 = require("./qa-executor");
const bug_fix_loop_1 = require("./bug-fix-loop");
const delivery_1 = require("./delivery");
const fs_1 = require("fs");
const path_1 = require("path");
const prisma = new client_1.PrismaClient();
// ============================================================================
// PIPELINE CLASS
// ============================================================================
class Pipeline {
    config;
    phases = [];
    currentPhase = null;
    startTime = 0;
    logCallback;
    constructor(config) {
        this.config = {
            outputDirectory: config.outputDirectory || './generated-projects',
            ollamaEndpoint: config.ollamaEndpoint || 'http://localhost:11434',
            ollamaModel: config.ollamaModel || 'qwen2.5-coder:32b',
            autoFix: config.autoFix ?? true,
            autoDeploy: config.autoDeploy ?? false,
            ...config
        };
    }
    /**
     * Registar callback para logs (SSE broadcast)
     */
    onLog(callback) {
        this.logCallback = callback;
    }
    /**
     * Executar pipeline completo
     */
    async run() {
        this.startTime = Date.now();
        try {
            // Carregar project da DB
            const project = await prisma.project.findUnique({
                where: { id: this.config.projectId },
                include: { messages: true }
            });
            if (!project) {
                throw new Error(`Project ${this.config.projectId} não encontrado`);
            }
            if (!project.prd) {
                throw new Error('Project não tem PRD gerado. Execute PM Agent primeiro.');
            }
            const estimatedTime = project.prd.estimatedMinutes || 30;
            this.log('INFO', `🚀 Pipeline iniciado para "${project.name}"`, `A construir "${project.name}"...`);
            this.log('INFO', `⏱️  Tempo estimado: ${estimatedTime} minutos`);
            // Update status inicial
            await this.updateProjectStatus(client_1.ProjectStatus.PLANNING);
            // FASE 1: PM Agent (já executado, carregar PRD)
            await this.startPhase('PM');
            this.log('SUCCESS', '✅ PRD já gerado pelo PM Agent', 'PRD pronto');
            const prd = project.prd;
            await this.completePhase({ prd });
            // FASE 2: Architect Agent
            await this.startPhase('ARCHITECT');
            await this.updateProjectStatus(client_1.ProjectStatus.PLANNING);
            this.log('INFO', '🏗️  Architect Agent a gerar arquitectura técnica...', 'A planear arquitectura...');
            const architectAgent = new architect_1.ArchitectAgent();
            const architecture = await architectAgent.generateArchitecture(prd);
            this.log('SUCCESS', `✅ Arquitectura gerada (${architecture.databaseSchema.tables.length} tabelas, ${architecture.technicalRules.length} regras)`, 'Arquitectura pronta');
            await this.completePhase({ architecture });
            // Gravar architecture na DB
            await prisma.project.update({
                where: { id: this.config.projectId },
                data: { architecture: architecture }
            });
            // FASE 3: Dev Team (4 devs paralelo)
            await this.startPhase('FRONTEND'); // Usamos FRONTEND como proxy para Dev Team
            await this.updateProjectStatus(client_1.ProjectStatus.BUILDING);
            this.log('INFO', '👨‍💻 Dev Team a gerar código (4 agentes em paralelo)...', 'A escrever código...');
            const outputPath = (0, path_1.join)(this.config.outputDirectory, project.id);
            if (!(0, fs_1.existsSync)(outputPath)) {
                (0, fs_1.mkdirSync)(outputPath, { recursive: true });
            }
            const devTeam = new dev_team_1.DevTeam();
            const codeResult = await devTeam.execute({
                architecture: architecture.architectureMarkdown,
                technicalRules: architecture.technicalRules
            });
            this.log('SUCCESS', `✅ Código gerado (${codeResult.stats.successful}/${codeResult.stats.total} ficheiros)`, 'Código pronto');
            await this.completePhase({ codeResult });
            // Update outputPath na DB
            await prisma.project.update({
                where: { id: this.config.projectId },
                data: { outputPath }
            });
            // FASE 4: QA Pipeline
            await this.startPhase('QA');
            await this.updateProjectStatus(client_1.ProjectStatus.QA);
            this.log('INFO', '🔍 QA Engine a executar validações...', 'A testar código...');
            const qaResults = await (0, qa_executor_1.executeQA)({
                prd: JSON.stringify(prd),
                projectPath: outputPath,
                headless: true,
                autoFix: false, // Não auto-fix aqui, fazemos no próximo step
                claudeApiKey: this.config.claudeApiKey,
                ollamaEndpoint: this.config.ollamaEndpoint
            });
            this.log('INFO', `QA Score: ${qaResults.score.percentage}% (${qaResults.score.passed}/${qaResults.score.passed + qaResults.score.failed} checks)`);
            if (qaResults.allBugs.length > 0) {
                this.log('WARN', `⚠️  ${qaResults.allBugs.length} bug(s) encontrado(s)`, `${qaResults.allBugs.length} problemas encontrados`);
            }
            else {
                this.log('SUCCESS', '✅ Nenhum bug encontrado!', 'Código perfeito');
            }
            await this.completePhase({ qaResults });
            // Gravar QA report na DB
            await prisma.project.update({
                where: { id: this.config.projectId },
                data: {
                    qaReport: qaResults,
                    qaScore: qaResults.score.percentage
                }
            });
            // FASE 5: Bug Fix Loop (se necessário e autoFix ativo)
            let bugFixResults = null;
            if (this.config.autoFix && qaResults.allBugs.length > 0) {
                await this.startPhase('BUGFIX');
                await this.updateProjectStatus(client_1.ProjectStatus.FIXING);
                this.log('INFO', `🔧 Bug Fix Loop a corrigir ${qaResults.allBugs.length} bug(s)...`, 'A corrigir problemas...');
                bugFixResults = await (0, bug_fix_loop_1.runBatchBugFix)(qaResults.allBugs, qaResults.checklist, {
                    maxIterations: 10,
                    ollamaModel: this.config.ollamaModel,
                    ollamaEndpoint: this.config.ollamaEndpoint,
                    claudeApiKey: this.config.claudeApiKey,
                    projectPath: outputPath,
                    browser: await (await Promise.resolve().then(() => __importStar(require('playwright')))).chromium.launch({ headless: true })
                });
                const fixed = bugFixResults.filter((r) => r.fixed).length;
                this.log('SUCCESS', `✅ ${fixed}/${qaResults.allBugs.length} bugs corrigidos`, `${fixed} problemas resolvidos`);
                await this.completePhase({ bugFixResults });
                // Atualizar loopCount
                await prisma.project.update({
                    where: { id: this.config.projectId },
                    data: { loopCount: { increment: 1 } }
                });
            }
            else {
                this.log('INFO', '⏭️  Bug Fix Loop ignorado (autoFix desativo ou sem bugs)');
            }
            // FASE 6: Delivery Agent
            await this.startPhase('DELIVERY');
            await this.updateProjectStatus(client_1.ProjectStatus.DEPLOYING);
            this.log('INFO', '📦 Delivery Agent a preparar documentação...', 'A preparar entrega...');
            const deliveryAgent = new delivery_1.DeliveryAgent(this.config.claudeApiKey);
            const deliveryDoc = await deliveryAgent.generateDeliveryDoc(prd, architecture, codeResult, qaResults, bugFixResults);
            this.log('SUCCESS', '✅ DELIVERY.md gerado');
            // Gravar DELIVERY.md no disco
            (0, fs_1.writeFileSync)((0, path_1.join)(outputPath, 'DELIVERY.md'), deliveryDoc.markdown, 'utf-8');
            // Aprovar para produção
            const approval = await deliveryAgent.approveForProduction(deliveryDoc, qaResults);
            if (approval.approved) {
                this.log('SUCCESS', '✅ Aprovado para produção!', 'Pronto para produção');
                await this.updateProjectStatus(client_1.ProjectStatus.DELIVERED);
            }
            else {
                this.log('WARN', `⚠️  Não aprovado para produção (${approval.blockers.length} blockers)`, 'Necessita revisão');
                for (const blocker of approval.blockers) {
                    this.log('ERROR', `  - ${blocker}`);
                }
            }
            await this.completePhase({ deliveryDoc, approval });
            // Calcular tempo total
            const totalTime = Date.now() - this.startTime;
            // Update actualMin na DB
            await prisma.project.update({
                where: { id: this.config.projectId },
                data: { actualMin: Math.ceil(totalTime / 1000 / 60) }
            });
            this.log('SUCCESS', `🎉 Pipeline completo em ${(totalTime / 1000 / 60).toFixed(1)} minutos!`, 'Concluído!');
            return {
                success: true,
                projectId: this.config.projectId,
                status: approval.approved ? client_1.ProjectStatus.DELIVERED : client_1.ProjectStatus.QA,
                phases: this.phases,
                artifacts: {
                    prd,
                    architecture,
                    code: codeResult,
                    qaReport: qaResults,
                    bugFixResults,
                    deliveryDoc,
                    approval
                },
                totalTime,
                estimatedTime: estimatedTime * 60 * 1000
            };
        }
        catch (error) {
            this.log('ERROR', `💥 Pipeline falhou: ${error instanceof Error ? error.message : String(error)}`, 'Erro no pipeline');
            await this.updateProjectStatus(client_1.ProjectStatus.FAILED);
            if (this.currentPhase) {
                this.currentPhase.status = client_1.PhaseStatus.ERROR;
                this.currentPhase.error = error instanceof Error ? error.message : String(error);
                this.currentPhase.endTime = new Date();
            }
            return {
                success: false,
                projectId: this.config.projectId,
                status: client_1.ProjectStatus.FAILED,
                phases: this.phases,
                artifacts: {},
                totalTime: Date.now() - this.startTime,
                estimatedTime: 0,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    /**
     * Iniciar nova fase
     */
    async startPhase(type) {
        // Completar fase anterior se existir
        if (this.currentPhase && !this.currentPhase.endTime) {
            await this.completePhase();
        }
        this.currentPhase = {
            type,
            status: client_1.PhaseStatus.RUNNING,
            startTime: new Date(),
            logs: []
        };
        this.phases.push(this.currentPhase);
        // Criar Phase na DB
        await prisma.phase.create({
            data: {
                projectId: this.config.projectId,
                type,
                status: client_1.PhaseStatus.RUNNING,
                startedAt: this.currentPhase.startTime
            }
        });
    }
    /**
     * Completar fase actual
     */
    async completePhase(output) {
        if (!this.currentPhase)
            return;
        this.currentPhase.status = client_1.PhaseStatus.DONE;
        this.currentPhase.endTime = new Date();
        this.currentPhase.duration = this.currentPhase.endTime.getTime() - this.currentPhase.startTime.getTime();
        if (output) {
            this.currentPhase.output = output;
        }
        // Update Phase na DB
        const phases = await prisma.phase.findMany({
            where: {
                projectId: this.config.projectId,
                type: this.currentPhase.type
            },
            orderBy: { startedAt: 'desc' },
            take: 1
        });
        if (phases.length > 0) {
            await prisma.phase.update({
                where: { id: phases[0].id },
                data: {
                    status: client_1.PhaseStatus.DONE,
                    finishedAt: this.currentPhase.endTime,
                    durationSec: Math.ceil(this.currentPhase.duration / 1000),
                    technicalOutput: JSON.stringify(output)
                }
            });
        }
        this.currentPhase = null;
    }
    /**
     * Update project status
     */
    async updateProjectStatus(status) {
        await prisma.project.update({
            where: { id: this.config.projectId },
            data: { status }
        });
    }
    /**
     * Logging helper
     */
    log(level, message, userMessage) {
        const log = {
            timestamp: new Date(),
            level,
            message,
            userMessage
        };
        if (this.currentPhase) {
            this.currentPhase.logs.push(log);
        }
        // Chamar callback se existir (SSE broadcast)
        if (this.logCallback) {
            this.logCallback(log);
        }
        // Console log
        const icon = {
            DEBUG: '🔍',
            INFO: 'ℹ️',
            WARN: '⚠️',
            ERROR: '❌',
            SUCCESS: '✅'
        }[level];
        console.log(`${icon} ${message}`);
    }
}
exports.Pipeline = Pipeline;
/**
 * Helper para executar pipeline standalone
 */
async function runPipeline(config) {
    const pipeline = new Pipeline(config);
    return pipeline.run();
}
