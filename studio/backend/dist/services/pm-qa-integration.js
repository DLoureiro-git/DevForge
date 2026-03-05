/**
 * DevForge V2 - Integração PM Agent + QA System
 * Demonstra como o PM Agent pode usar o sistema de QA
 */
import { executeQA, executeQuickQA, generateQAReport } from './qa-executor';
import { writeFileSync } from 'fs';
import { join } from 'path';
// ============================================================================
// PM AGENT ACTIONS
// ============================================================================
/**
 * Action: Validar projeto após build
 */
export async function pmValidateProject(params) {
    console.log(`🔍 PM Agent: Validando projeto ${params.projectId}...`);
    const result = await executeQA({
        prd: params.prd,
        projectPath: params.projectPath,
        deployUrl: params.deployUrl,
        headless: true,
        autoFix: false,
    });
    // Guardar relatório no projeto
    const reportPath = join(params.projectPath, 'qa-report.md');
    const report = generateQAReport(result);
    writeFileSync(reportPath, report);
    console.log(`✅ Relatório guardado: ${reportPath}`);
    return result;
}
/**
 * Action: Quick check antes de deploy
 */
export async function pmPreDeployCheck(params) {
    console.log(`⚡ PM Agent: Pre-deploy check para ${params.projectId}...`);
    const result = await executeQuickQA({
        prd: params.prd,
        projectPath: params.projectPath,
        deployUrl: params.deployUrl,
        headless: true,
    });
    // Critérios de aprovação
    const canDeploy = result.score.percentage >= 70 &&
        result.score.blockers.length === 0;
    if (canDeploy) {
        console.log(`✅ Pre-deploy check passou: ${result.score.percentage}%`);
    }
    else {
        console.log(`❌ Pre-deploy check falhou:`);
        console.log(`   Score: ${result.score.percentage}%`);
        console.log(`   Blockers: ${result.score.blockers.length}`);
    }
    return canDeploy;
}
/**
 * Action: Auto-fix de bugs após detecção
 */
export async function pmAutoFixBugs(params) {
    console.log(`🔧 PM Agent: Auto-fix de bugs em ${params.projectId}...`);
    const result = await executeQA({
        prd: params.prd,
        projectPath: params.projectPath,
        deployUrl: params.deployUrl,
        headless: true,
        autoFix: true,
        claudeApiKey: params.claudeApiKey || process.env.ANTHROPIC_API_KEY,
        ollamaEndpoint: 'http://localhost:11434',
    });
    if (result.autoFixResults) {
        const fixed = result.autoFixResults.filter((r) => r.fixed).length;
        const total = result.autoFixResults.length;
        console.log(`✅ ${fixed}/${total} bugs corrigidos automaticamente`);
    }
    return result;
}
/**
 * Action: Validação contínua (CI/CD)
 */
export async function pmContinuousValidation(params) {
    console.log(`🔄 PM Agent: Validação contínua ${params.projectId}...`);
    const result = await executeQA({
        prd: params.prd,
        projectPath: params.projectPath,
        deployUrl: params.deployUrl,
        headless: true,
        autoFix: false,
    });
    const minScore = params.minScore || 70;
    const passed = result.score.percentage >= minScore &&
        result.score.blockers.length === 0;
    if (passed) {
        console.log(`✅ CI passou: ${result.score.percentage}% (mínimo: ${minScore}%)`);
    }
    else {
        console.log(`❌ CI falhou:`);
        console.log(`   Score: ${result.score.percentage}% (mínimo: ${minScore}%)`);
        console.log(`   Blockers: ${result.score.blockers.length}`);
    }
    return { passed, result };
}
// ============================================================================
// PM AGENT WORKFLOW COMPLETO
// ============================================================================
/**
 * Workflow: Build → QA → Fix → Deploy
 */
export async function pmFullWorkflow(params) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`PM Agent: Workflow Completo - ${params.projectId}`);
    console.log(`${'='.repeat(60)}\n`);
    // 1. Quick check inicial
    console.log('📊 Fase 1: Quick Check...');
    const quickResult = await executeQuickQA({
        prd: params.prd,
        projectPath: params.projectPath,
        deployUrl: params.deployUrl,
        headless: true,
    });
    if (quickResult.score.blockers.length > 0) {
        console.log(`❌ Quick check falhou: ${quickResult.score.blockers.length} blockers críticos`);
        return { success: false, finalScore: quickResult.score.percentage };
    }
    console.log(`✅ Quick check passou: ${quickResult.score.percentage}%\n`);
    // 2. Validação completa
    console.log('🔍 Fase 2: Validação Completa...');
    const fullResult = await executeQA({
        prd: params.prd,
        projectPath: params.projectPath,
        deployUrl: params.deployUrl,
        headless: true,
        autoFix: false,
    });
    console.log(`📊 Validação completa: ${fullResult.score.percentage}%`);
    console.log(`🐛 Bugs encontrados: ${fullResult.allBugs.length}\n`);
    // 3. Auto-fix se necessário
    if (fullResult.allBugs.length > 0 && fullResult.score.percentage < 90) {
        console.log('🔧 Fase 3: Auto-Fix de Bugs...');
        const fixResult = await pmAutoFixBugs({
            ...params,
        });
        if (fixResult.autoFixResults) {
            const fixed = fixResult.autoFixResults.filter((r) => r.fixed).length;
            console.log(`✅ ${fixed} bugs corrigidos\n`);
        }
    }
    // 4. Validação final
    console.log('✅ Fase 4: Validação Final...');
    const finalResult = await executeQuickQA({
        prd: params.prd,
        projectPath: params.projectPath,
        deployUrl: params.deployUrl,
        headless: true,
    });
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Score Final: ${finalResult.score.percentage}%`);
    console.log(`${'='.repeat(60)}\n`);
    const success = finalResult.score.percentage >= 70 && finalResult.score.blockers.length === 0;
    if (success) {
        console.log('✅ Projeto aprovado para deploy!');
    }
    else {
        console.log('❌ Projeto NÃO aprovado. Corrigir bugs antes de deploy.');
    }
    // Guardar relatório final
    const reportPath = join(params.projectPath, 'qa-final-report.md');
    const report = generateQAReport(finalResult);
    writeFileSync(reportPath, report);
    console.log(`\n📄 Relatório final: ${reportPath}\n`);
    return {
        success,
        finalScore: finalResult.score.percentage,
    };
}
// ============================================================================
// PM AGENT NOTIFICATIONS
// ============================================================================
/**
 * Notificar utilizador sobre resultados de QA
 */
export function pmNotifyQAResults(result, notifyFn) {
    const icon = result.score.percentage >= 80 ? '✅' : '⚠️';
    let message = `${icon} QA Completo\n\n`;
    message += `Score: ${result.score.percentage}%\n`;
    message += `Bugs: ${result.allBugs.length}\n`;
    if (result.score.blockers.length > 0) {
        message += `\n⚠️ ${result.score.blockers.length} BLOCKER(S):\n`;
        for (const blocker of result.score.blockers.slice(0, 3)) {
            message += `• ${blocker.title}\n`;
        }
    }
    if (result.autoFixResults) {
        const fixed = result.autoFixResults.filter((r) => r.fixed).length;
        message += `\n🔧 ${fixed} bugs corrigidos automaticamente\n`;
    }
    notifyFn(message);
}
// ============================================================================
// EXAMPLE USAGE
// ============================================================================
async function exampleIntegration() {
    const projectConfig = {
        projectId: 'proj_123',
        projectPath: '/caminho/para/projeto',
        deployUrl: 'https://meu-app.vercel.app',
        prd: `
      Sistema de gestão de tarefas com:
      - Autenticação
      - Dashboard responsivo
      - Tempo real
      - Deploy: Vercel
    `,
        claudeApiKey: process.env.ANTHROPIC_API_KEY,
    };
    // Executar workflow completo
    const result = await pmFullWorkflow(projectConfig);
    // Notificar (exemplo: via email ou WhatsApp)
    if (result.success) {
        console.log('✅ Deploy pode prosseguir');
    }
    else {
        console.log('❌ Deploy bloqueado');
    }
}
// ============================================================================
// EXPORT
// ============================================================================
export { exampleIntegration, };
