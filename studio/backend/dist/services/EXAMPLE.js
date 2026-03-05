"use strict";
/**
 * EXEMPLO DE USO DO PIPELINE COMPLETO
 *
 * Este ficheiro demonstra como usar o DevForge V2 Pipeline
 * para gerar uma aplicação completa do zero.
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
exports.exemploCompleto = exemploCompleto;
exports.exemploDeployAutomatico = exemploDeployAutomatico;
exports.exemploGerarZip = exemploGerarZip;
exports.exemploMonitoringSSE = exemploMonitoringSSE;
const orchestrator_1 = require("./orchestrator");
const pm_agent_1 = require("./pm-agent");
const deploy_service_1 = require("./deploy-service");
const project_generator_1 = require("./project-generator");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ============================================================================
// EXEMPLO 1: Pipeline Completo (PM → Delivery)
// ============================================================================
async function exemploCompleto() {
    console.log('='.repeat(60));
    console.log('EXEMPLO 1: Pipeline Completo');
    console.log('='.repeat(60));
    // 1. CRIAR PROJECT NA DB
    const user = await prisma.user.findFirst(); // Assumindo que existe utilizador
    if (!user) {
        console.error('❌ Nenhum utilizador encontrado na DB');
        return;
    }
    const project = await prisma.project.create({
        data: {
            userId: user.id,
            name: 'Task Manager App',
            description: 'Quero uma app para gerir as minhas tarefas diárias',
            status: 'INTAKE'
        }
    });
    console.log(`✅ Project criado: ${project.id}`);
    // 2. EXECUTAR PM AGENT (Intake conversacional)
    const pmAgent = new pm_agent_1.PMAgent();
    // Simular conversa (na realidade isto seria interactivo)
    const mensagens = [
        'Quero uma app para gerir as minhas tarefas diárias',
        'Só eu vou usar',
        'Preciso organizar tarefas por projecto e prioridade',
        'Não tenho referência específica',
        'Não preciso de conta',
        'Não vou cobrar',
        'Eu crio as tarefas',
        'Seria bom ter estatísticas',
        'Mais importante no computador',
        'Não preciso de integrações',
        'Azul e branco',
        'Simples e limpo',
        'Não tenho referência visual'
    ];
    let prd = null;
    for (const msg of mensagens) {
        const result = await pmAgent.processMessage(msg, []);
        if (result.isComplete && result.prd) {
            prd = result.prd;
            break;
        }
    }
    if (!prd) {
        console.error('❌ PM Agent não gerou PRD');
        return;
    }
    // Gravar PRD na DB
    await prisma.project.update({
        where: { id: project.id },
        data: { prd: prd }
    });
    console.log('✅ PRD gerado pelo PM Agent');
    // 3. EXECUTAR PIPELINE COMPLETO
    const pipeline = new orchestrator_1.Pipeline({
        projectId: project.id,
        outputDirectory: './generated-projects',
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'qwen2.5-coder:32b',
        claudeApiKey: process.env.ANTHROPIC_API_KEY,
        autoFix: true,
        autoDeploy: false
    });
    // Registar callback para logs (SSE em produção)
    pipeline.onLog((log) => {
        const icon = {
            DEBUG: '🔍',
            INFO: 'ℹ️',
            WARN: '⚠️',
            ERROR: '❌',
            SUCCESS: '✅'
        }[log.level];
        console.log(`${icon} ${log.userMessage || log.message}`);
    });
    console.log('\n🚀 Iniciando pipeline...\n');
    const result = await pipeline.run();
    console.log('\n' + '='.repeat(60));
    if (result.success) {
        console.log('✅ PIPELINE COMPLETO!');
        console.log(`   Ficheiros gerados: ${result.artifacts.code?.stats.successful}`);
        console.log(`   QA Score: ${result.artifacts.qaReport?.score.percentage}%`);
        console.log(`   Bugs corrigidos: ${result.artifacts.bugFixResults?.filter((r) => r.fixed).length || 0}`);
        console.log(`   Tempo total: ${(result.totalTime / 1000 / 60).toFixed(1)} min`);
        if (result.artifacts.approval?.approved) {
            console.log('   Status: ✅ APROVADO PARA PRODUÇÃO');
        }
        else {
            console.log('   Status: ⚠️  NECESSITA REVISÃO');
            console.log(`   Blockers: ${result.artifacts.approval?.blockers.join(', ')}`);
        }
    }
    else {
        console.log('❌ PIPELINE FALHOU');
        console.log(`   Erro: ${result.error}`);
    }
    console.log('='.repeat(60));
}
// ============================================================================
// EXEMPLO 2: Deploy Automático
// ============================================================================
async function exemploDeployAutomatico() {
    console.log('='.repeat(60));
    console.log('EXEMPLO 2: Deploy Automático');
    console.log('='.repeat(60));
    const projectId = 'abc123'; // ID de um projecto já gerado
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project || !project.outputPath) {
        console.error('❌ Project não encontrado ou sem código gerado');
        return;
    }
    // 1. GERAR FICHEIROS DE PROJECTO (package.json, README, etc.)
    const generator = new project_generator_1.ProjectGenerator();
    generator.generatePackageJson(project.prd, project.outputPath);
    generator.generateEnvExample(project.architecture, project.outputPath);
    generator.generateReadme({
        projectId: project.id,
        projectName: project.name,
        outputPath: project.outputPath,
        prd: project.prd,
        architecture: project.architecture
    });
    generator.generateGitignore(project.outputPath);
    console.log('✅ Ficheiros de projecto gerados');
    // 2. DEPLOY COMPLETO (GitHub + Vercel + Railway)
    const deployService = new deploy_service_1.DeployService();
    const deployResult = await deployService.deployComplete({
        projectPath: project.outputPath,
        projectName: project.name,
        envVars: {
            DATABASE_URL: process.env.DATABASE_URL,
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
            NEXTAUTH_URL: 'https://my-app.vercel.app'
        },
        githubToken: process.env.GITHUB_TOKEN,
        vercelToken: process.env.VERCEL_TOKEN,
        railwayToken: process.env.RAILWAY_TOKEN
    });
    console.log('\n📊 Deploy Results:\n');
    if (deployResult.github?.success) {
        console.log(`✅ GitHub: ${deployResult.github.repoUrl}`);
    }
    else {
        console.log(`❌ GitHub: ${deployResult.github?.error}`);
    }
    if (deployResult.vercel?.success) {
        console.log(`✅ Vercel: ${deployResult.vercel.url}`);
        // Gravar URL na DB
        await prisma.project.update({
            where: { id: project.id },
            data: {
                deployUrl: deployResult.vercel.url,
                repoUrl: deployResult.github?.repoUrl
            }
        });
    }
    else {
        console.log(`❌ Vercel: ${deployResult.vercel?.error}`);
    }
    if (deployResult.railway?.success) {
        console.log(`✅ Railway: ${deployResult.railway.url}`);
    }
    else {
        console.log(`❌ Railway: ${deployResult.railway?.error}`);
    }
    console.log('='.repeat(60));
}
// ============================================================================
// EXEMPLO 3: Gerar ZIP do Projecto
// ============================================================================
async function exemploGerarZip() {
    console.log('='.repeat(60));
    console.log('EXEMPLO 3: Gerar ZIP do Projecto');
    console.log('='.repeat(60));
    const projectId = 'abc123';
    const project = await prisma.project.findUnique({
        where: { id: projectId }
    });
    if (!project || !project.outputPath) {
        console.error('❌ Project não encontrado ou sem código gerado');
        return;
    }
    const generator = new project_generator_1.ProjectGenerator();
    console.log('📦 Criando ZIP...');
    const zipBuffer = await generator.zipProject(project.outputPath);
    console.log(`✅ ZIP criado (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    // Gravar ZIP no disco (opcional)
    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
    fs.writeFileSync(`./downloads/${project.name}.zip`, zipBuffer);
    console.log(`💾 ZIP gravado em ./downloads/${project.name}.zip`);
    console.log('='.repeat(60));
}
// ============================================================================
// EXEMPLO 4: Monitoring em Tempo Real (SSE)
// ============================================================================
async function exemploMonitoringSSE() {
    console.log('='.repeat(60));
    console.log('EXEMPLO 4: Monitoring em Tempo Real (SSE)');
    console.log('='.repeat(60));
    const projectId = 'abc123';
    const pipeline = new orchestrator_1.Pipeline({
        projectId,
        claudeApiKey: process.env.ANTHROPIC_API_KEY
    });
    // Simular SSE broadcast
    const sseClients = []; // Na realidade seria array de Response streams
    pipeline.onLog((log) => {
        const sseMessage = {
            timestamp: log.timestamp,
            level: log.level,
            message: log.userMessage || log.message,
            technical: log.message
        };
        // Broadcast para todos os clientes SSE conectados
        for (const client of sseClients) {
            client.write(`data: ${JSON.stringify(sseMessage)}\n\n`);
        }
        // Console log para debug
        console.log(`[${log.level}] ${log.message}`);
    });
    await pipeline.run();
    console.log('='.repeat(60));
}
// ============================================================================
// EXECUTAR EXEMPLOS
// ============================================================================
async function main() {
    const exemplo = process.argv[2] || '1';
    switch (exemplo) {
        case '1':
            await exemploCompleto();
            break;
        case '2':
            await exemploDeployAutomatico();
            break;
        case '3':
            await exemploGerarZip();
            break;
        case '4':
            await exemploMonitoringSSE();
            break;
        default:
            console.log('Uso: tsx EXAMPLE.ts [1|2|3|4]');
            console.log('  1 - Pipeline Completo');
            console.log('  2 - Deploy Automático');
            console.log('  3 - Gerar ZIP');
            console.log('  4 - Monitoring SSE');
    }
    await prisma.$disconnect();
}
