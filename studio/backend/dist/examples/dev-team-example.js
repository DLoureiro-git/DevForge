"use strict";
/**
 * EXEMPLO DE USO DO DEV TEAM
 *
 * Demonstra como usar o DevTeam para gerar código automaticamente
 * a partir de uma architecture gerada pelo Architect Agent
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.exampleDevTeamFlow = exampleDevTeamFlow;
const dev_team_1 = require("../services/dev-team");
const architect_1 = require("../services/architect");
async function exampleDevTeamFlow() {
    console.log('🚀 DevForge V2 — Dev Team Example\n');
    // 1. Mock de um PRD simples
    const mockPRD = {
        projectName: 'Blog Simples',
        tagline: 'Sistema de blog com posts e comentários',
        userSummary: 'Um blog onde users podem criar posts e comentar',
        complexity: 'médio',
        estimatedMinutes: 120,
        features: [
            {
                name: 'Autenticação',
                priority: 'alta',
                description: 'Login/Signup com email/password'
            },
            {
                name: 'Posts',
                priority: 'alta',
                description: 'Criar, editar, deletar posts'
            },
            {
                name: 'Comentários',
                priority: 'média',
                description: 'Comentar em posts'
            }
        ],
        technical: {
            hasAuth: true,
            hasPayments: false,
            hasMultiTenant: false,
            hasEmail: false,
            hasFileUpload: false,
            authMethod: ['credentials']
        }
    };
    // 2. Gerar Architecture com Architect Agent
    console.log('📐 Gerando architecture com Architect Agent...\n');
    const architect = new architect_1.ArchitectAgent();
    const architecture = await architect.generateArchitecture(mockPRD);
    console.log('✅ Architecture gerada!');
    console.log(`  - Stack: ${architecture.stack.frontend}`);
    console.log(`  - Database: ${architecture.stack.database}`);
    console.log(`  - Tabelas: ${architecture.databaseSchema.tables.length}`);
    console.log(`  - Regras técnicas: ${architecture.technicalRules.length}\n`);
    // 3. Executar Dev Team
    console.log('👥 Executando Dev Team...\n');
    const devTeam = new dev_team_1.DevTeam();
    const result = await devTeam.execute({
        architecture: architecture.architectureMarkdown,
        technicalRules: architecture.technicalRules
    });
    // 4. Resultados
    console.log('\n📊 Resultados:');
    console.log(`  - Total ficheiros: ${result.stats.total}`);
    console.log(`  - Sucessos: ${result.stats.successful}`);
    console.log(`  - Falhas: ${result.stats.failed}`);
    console.log(`  - Sem mudanças: ${result.stats.noChanges}`);
    console.log(`  - Tempo total: ${(result.totalDuration / 1000).toFixed(2)}s\n`);
    // 5. Listar ficheiros gerados
    console.log('📁 Ficheiros gerados:');
    result.files.forEach(file => {
        const emoji = file.success ? '✅' : '❌';
        const lines = file.code ? file.code.split('\n').length : 0;
        const info = file.noChanges ? '(sem mudanças)' : `(${lines} linhas)`;
        console.log(`  ${emoji} [${file.devRole}] ${file.filePath} ${info}`);
    });
    // 6. Exemplo de código gerado
    const firstFile = result.files.find(f => f.success && f.code);
    if (firstFile) {
        console.log(`\n📝 Preview de ${firstFile.filePath}:`);
        console.log('─'.repeat(60));
        const preview = firstFile.code.split('\n').slice(0, 15).join('\n');
        console.log(preview);
        console.log('...');
        console.log('─'.repeat(60));
    }
    console.log('\n✨ Dev Team flow concluído!');
}
// Executar se chamado directamente
if (require.main === module) {
    exampleDevTeamFlow().catch(console.error);
}
