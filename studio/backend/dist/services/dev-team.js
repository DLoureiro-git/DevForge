"use strict";
/**
 * DEV TEAM ORCHESTRATOR
 *
 * Coordena 4 developers especializados em paralelo:
 * - Frontend Dev (pages, components)
 * - Backend Dev (API routes)
 * - Database Dev (Prisma schema)
 * - Utils Dev (contexts, hooks, utils)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.devTeam = exports.DevTeam = void 0;
const frontend_dev_1 = require("./devs/frontend-dev");
const backend_dev_1 = require("./devs/backend-dev");
const database_dev_1 = require("./devs/database-dev");
const utils_dev_1 = require("./devs/utils-dev");
class DevTeam {
    frontendDev;
    backendDev;
    databaseDev;
    utilsDev;
    constructor() {
        this.frontendDev = new frontend_dev_1.FrontendDev();
        this.backendDev = new backend_dev_1.BackendDev();
        this.databaseDev = new database_dev_1.DatabaseDev();
        this.utilsDev = new utils_dev_1.UtilsDev();
    }
    /**
     * Parse ARCHITECTURE.md e atribuir ficheiros aos devs corretos
     */
    assignFilesToDevs(architecture) {
        const assignments = [];
        const lines = architecture.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            // Ignorar linhas vazias, headers, código
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```')) {
                continue;
            }
            // Backend: API routes
            if (trimmed.includes('route.ts')) {
                const filePath = this.extractFilePath(trimmed);
                if (filePath) {
                    assignments.push({
                        devRole: 'backend',
                        filePath,
                        description: 'API route handler'
                    });
                }
            }
            // Frontend: Pages
            else if (trimmed.includes('page.tsx')) {
                const filePath = this.extractFilePath(trimmed);
                if (filePath) {
                    assignments.push({
                        devRole: 'frontend',
                        filePath,
                        description: 'React page component'
                    });
                }
            }
            // Frontend: Components
            else if (trimmed.includes('.tsx') && trimmed.toLowerCase().includes('component')) {
                const filePath = this.extractFilePath(trimmed);
                if (filePath) {
                    assignments.push({
                        devRole: 'frontend',
                        filePath,
                        description: 'React component'
                    });
                }
            }
            // Database: Prisma schema
            else if (trimmed.includes('schema.prisma')) {
                assignments.push({
                    devRole: 'database',
                    filePath: 'prisma/schema.prisma',
                    description: 'Prisma schema changes'
                });
            }
            // Utils: Contexts
            else if (trimmed.includes('Context.tsx')) {
                const filePath = this.extractFilePath(trimmed);
                if (filePath) {
                    assignments.push({
                        devRole: 'utils',
                        filePath,
                        description: 'React context'
                    });
                }
            }
            // Utils: Hooks
            else if (trimmed.includes('Hook') || trimmed.includes('use')) {
                const filePath = this.extractFilePath(trimmed);
                if (filePath && filePath.includes('.ts')) {
                    assignments.push({
                        devRole: 'utils',
                        filePath,
                        description: 'Custom React hook'
                    });
                }
            }
        }
        // Se não encontrou nenhum assignment, criar genérico
        if (assignments.length === 0) {
            assignments.push({
                devRole: 'frontend',
                filePath: 'src/app/(app)/nova-feature/page.tsx',
                description: 'Nova página baseada na architecture'
            });
        }
        return assignments;
    }
    /**
     * Extrair file path de uma linha (remove comentários, bullets, etc)
     */
    extractFilePath(line) {
        // Remover bullets, asteriscos, traços
        let cleaned = line.replace(/^[-*•]\s*/, '').trim();
        // Remover comentários (# ...)
        cleaned = cleaned.split('#')[0].trim();
        // Remover backticks
        cleaned = cleaned.replace(/`/g, '');
        // Se tem extensão de ficheiro, é válido
        if (cleaned.match(/\.(tsx?|jsx?|prisma|css|json)$/)) {
            return cleaned;
        }
        return null;
    }
    /**
     * Gerar código para todos os ficheiros em paralelo
     */
    async generateAllCode(request, assignments) {
        const startTime = Date.now();
        // Criar promises para cada assignment
        const promises = assignments.map(async (assignment) => {
            const baseRequest = {
                architecture: request.architecture,
                filePath: assignment.filePath,
                fileDescription: assignment.description,
                technicalRules: request.technicalRules
            };
            let result;
            try {
                switch (assignment.devRole) {
                    case 'frontend':
                        const frontendResult = await this.frontendDev.generateCode(baseRequest);
                        result = {
                            ...frontendResult,
                            devRole: 'frontend'
                        };
                        break;
                    case 'backend':
                        const backendResult = await this.backendDev.generateCode(baseRequest);
                        result = {
                            ...backendResult,
                            devRole: 'backend'
                        };
                        break;
                    case 'database':
                        const dbResult = await this.databaseDev.generateCode(baseRequest);
                        result = {
                            ...dbResult,
                            devRole: 'database'
                        };
                        break;
                    case 'utils':
                        const utilsResult = await this.utilsDev.generateCode(baseRequest);
                        result = {
                            ...utilsResult,
                            devRole: 'utils'
                        };
                        break;
                    default:
                        result = {
                            success: false,
                            devRole: assignment.devRole,
                            filePath: assignment.filePath,
                            error: `Dev role desconhecido: ${assignment.devRole}`,
                            duration: 0
                        };
                }
            }
            catch (error) {
                result = {
                    success: false,
                    devRole: assignment.devRole,
                    filePath: assignment.filePath,
                    error: error.message || 'Erro ao gerar código',
                    duration: 0
                };
            }
            return result;
        });
        // Executar todos em paralelo
        const files = await Promise.all(promises);
        // Calcular stats
        const stats = {
            total: files.length,
            successful: files.filter(f => f.success && !f.noChanges).length,
            failed: files.filter(f => !f.success).length,
            noChanges: files.filter(f => f.noChanges).length
        };
        return {
            success: stats.failed === 0,
            files,
            totalDuration: Date.now() - startTime,
            stats
        };
    }
    /**
     * Pipeline completo: assign + generate
     */
    async execute(request) {
        // 1. Parse architecture e atribuir ficheiros
        const assignments = this.assignFilesToDevs(request.architecture);
        console.log(`[DevTeam] Atribuídos ${assignments.length} ficheiros:`);
        assignments.forEach(a => {
            console.log(`  - ${a.devRole}: ${a.filePath}`);
        });
        // 2. Gerar código em paralelo
        const result = await this.generateAllCode(request, assignments);
        console.log(`[DevTeam] Concluído em ${(result.totalDuration / 1000).toFixed(2)}s`);
        console.log(`  - Sucessos: ${result.stats.successful}`);
        console.log(`  - Falhas: ${result.stats.failed}`);
        console.log(`  - Sem mudanças: ${result.stats.noChanges}`);
        return result;
    }
    /**
     * Executar DevTeam para uma Feature específica
     */
    async executeFeature(request) {
        const startTime = Date.now();
        // Parse technical plan para criar assignments
        const assignments = [];
        // Ficheiros a criar
        if (request.technicalPlan.files?.create) {
            for (const file of request.technicalPlan.files.create) {
                const devRole = this.inferDevRole(file.path);
                assignments.push({
                    devRole,
                    filePath: file.path,
                    description: file.purpose || 'Feature file'
                });
            }
        }
        // Ficheiros a modificar
        if (request.technicalPlan.files?.modify) {
            for (const file of request.technicalPlan.files.modify) {
                const devRole = this.inferDevRole(file.path);
                assignments.push({
                    devRole,
                    filePath: file.path,
                    description: file.changes || 'Feature modification'
                });
            }
        }
        // Alterações DB
        if (request.technicalPlan.databaseChanges?.newTables?.length > 0 ||
            request.technicalPlan.databaseChanges?.modifiedTables?.length > 0) {
            assignments.push({
                devRole: 'database',
                filePath: 'prisma/schema.prisma',
                description: 'Database schema changes for feature'
            });
        }
        console.log(`[DevTeam] Feature "${request.feature.title}": ${assignments.length} ficheiros`);
        assignments.forEach(a => {
            console.log(`  - ${a.devRole}: ${a.filePath}`);
        });
        // Criar context augmentado para devs
        const featureContext = `
FEATURE: ${request.feature.title}
DESCRIPTION: ${request.feature.description}
TYPE: ${request.feature.type}
PRIORITY: ${request.feature.priority}

TECHNICAL PLAN:
${JSON.stringify(request.technicalPlan, null, 2)}

PROJECT ARCHITECTURE:
${JSON.stringify(request.architecture, null, 2)}
`;
        // Gerar código em paralelo
        const result = await this.generateAllCode({
            architecture: featureContext,
            technicalRules: [
                ...request.architecture.technicalRules || [],
                ...request.technicalPlan.technicalRules || []
            ]
        }, assignments);
        console.log(`[DevTeam] Feature concluída em ${(result.totalDuration / 1000).toFixed(2)}s`);
        console.log(`  - Sucessos: ${result.stats.successful}`);
        console.log(`  - Falhas: ${result.stats.failed}`);
        return result;
    }
    /**
     * Inferir dev role a partir do file path
     */
    inferDevRole(filePath) {
        if (filePath.includes('route.ts') || filePath.includes('/api/')) {
            return 'backend';
        }
        if (filePath.includes('.prisma')) {
            return 'database';
        }
        if (filePath.includes('page.tsx') || filePath.includes('component')) {
            return 'frontend';
        }
        if (filePath.includes('context') ||
            filePath.includes('hook') ||
            filePath.includes('util') ||
            filePath.includes('lib/')) {
            return 'utils';
        }
        // Default
        return 'frontend';
    }
}
exports.DevTeam = DevTeam;
// Singleton instance
exports.devTeam = new DevTeam();
