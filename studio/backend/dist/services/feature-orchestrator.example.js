"use strict";
/**
 * FEATURE PIPELINE — Exemplo de Uso
 *
 * Este exemplo mostra como executar o Feature Pipeline
 * para uma feature específica.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const feature_orchestrator_1 = require("./feature-orchestrator");
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        console.log('🚀 Feature Pipeline Example\n');
        // 1. Criar um projeto de teste (ou usar existente)
        const user = await prisma.user.findFirst();
        if (!user) {
            console.error('❌ No user found. Create a user first.');
            process.exit(1);
        }
        // 2. Criar um projeto de teste
        const project = await prisma.project.create({
            data: {
                userId: user.id,
                name: 'Test Project',
                description: 'A simple todo app',
                status: 'DELIVERED',
                prd: {
                    projectName: 'Test Project',
                    tagline: 'Simple todo app',
                    complexity: 'SIMPLE',
                    estimatedMinutes: 15,
                    userSummary: 'A todo app with CRUD operations',
                    features: [
                        {
                            name: 'Todo CRUD',
                            priority: 'HIGH',
                            description: 'Create, read, update, delete todos',
                        },
                    ],
                    technical: {
                        hasAuth: false,
                        hasPayments: false,
                        hasMultiTenant: false,
                        hasFileUpload: false,
                        hasEmail: false,
                    },
                },
                architecture: {
                    stack: {
                        frontend: 'Next.js 15',
                        backend: 'Next.js API Routes',
                        database: 'PostgreSQL + Prisma',
                        auth: 'None',
                        deployment: 'Vercel',
                    },
                    databaseSchema: {
                        tables: [
                            {
                                name: 'Todo',
                                fields: [
                                    { name: 'id', type: 'String', constraints: ['@id', '@default(cuid())'] },
                                    { name: 'title', type: 'String', constraints: [] },
                                    { name: 'completed', type: 'Boolean', constraints: ['@default(false)'] },
                                ],
                                relations: [],
                            },
                        ],
                    },
                    fileStructure: {},
                    technicalRules: ['Use TypeScript strict mode', 'Use Prisma for DB'],
                    architectureMarkdown: '# Architecture\n\nSimple todo app.',
                },
                outputPath: './generated-projects/test-project',
            },
        });
        console.log(`✅ Project created: ${project.id}\n`);
        // 3. Criar um team member
        const teamMember = await prisma.teamMember.create({
            data: {
                projectId: project.id,
                userId: user.id,
                role: 'OWNER',
                displayName: user.name || user.email,
                email: user.email,
            },
        });
        console.log(`✅ Team member created: ${teamMember.id}\n`);
        // 4. Criar uma feature de teste
        const feature = await prisma.feature.create({
            data: {
                projectId: project.id,
                title: 'Add priority field to todos',
                description: 'Users should be able to set a priority (LOW, MEDIUM, HIGH) for each todo',
                type: 'FEATURE',
                priority: 'HIGH',
                status: 'BACKLOG',
                requestedById: teamMember.id,
            },
        });
        console.log(`✅ Feature created: ${feature.id}\n`);
        // 5. Obter settings do user
        let settings = await prisma.settings.findUnique({
            where: { userId: user.id },
        });
        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    userId: user.id,
                    anthropicKey: process.env.ANTHROPIC_API_KEY || '',
                    ollamaUrl: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
                    ollamaModelDev: process.env.OLLAMA_MODEL || 'qwen2.5-coder:32b',
                    outputDirectory: './generated-projects',
                },
            });
        }
        if (!settings.anthropicKey) {
            console.error('❌ ANTHROPIC_API_KEY not configured');
            process.exit(1);
        }
        console.log('✅ Settings loaded\n');
        // 6. Executar Feature Pipeline
        console.log('🏗️  Starting Feature Pipeline...\n');
        const result = await (0, feature_orchestrator_1.runFeaturePipeline)({
            featureId: feature.id,
            projectId: project.id,
            claudeApiKey: settings.anthropicKey,
            ollamaEndpoint: settings.ollamaUrl,
            ollamaModel: settings.ollamaModelDev,
            outputDirectory: settings.outputDirectory,
            autoFix: true,
            maxFixIterations: 3, // Reduzir para teste
            targetQAScore: 90, // Reduzir para teste
        });
        // 7. Mostrar resultados
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESULTADOS DO PIPELINE');
        console.log('='.repeat(60));
        console.log(`Success: ${result.success}`);
        console.log(`Final Status: ${result.finalStatus}`);
        console.log(`QA Score: ${result.qaScore}%`);
        console.log(`Branch: ${result.branch}`);
        console.log(`Total Time: ${(result.totalTime / 1000 / 60).toFixed(2)} min`);
        console.log(`Error: ${result.error || 'None'}`);
        console.log('\n📝 Fases:');
        result.phases.forEach((phase, i) => {
            const duration = phase.duration ? `${(phase.duration / 1000).toFixed(1)}s` : 'N/A';
            console.log(`  ${i + 1}. ${phase.phase.padEnd(12)} [${phase.status}] ${duration}`);
        });
        console.log('\n' + '='.repeat(60));
        // 8. Verificar Feature na DB
        const updatedFeature = await prisma.feature.findUnique({
            where: { id: feature.id },
        });
        if (updatedFeature) {
            console.log('\n📦 Feature actualizada na DB:');
            console.log(`  Status: ${updatedFeature.status}`);
            console.log(`  Progress: ${updatedFeature.agentProgress}%`);
            console.log(`  QA Score: ${updatedFeature.qaScore || 0}%`);
            console.log(`  Branch: ${updatedFeature.branchName || 'N/A'}`);
            console.log(`  Logs: ${JSON.parse(updatedFeature.logs || '[]').length} entries`);
            console.log(`  Bugs: ${JSON.parse(updatedFeature.bugs || '[]').length} bugs`);
            if (updatedFeature.acceptanceCriteria) {
                const criteria = JSON.parse(updatedFeature.acceptanceCriteria);
                console.log(`  Acceptance Criteria: ${criteria.length} criteria`);
            }
        }
        console.log('\n✅ Example completed successfully!');
    }
    catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
// Executar
main();
