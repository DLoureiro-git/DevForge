"use strict";
/**
 * DevForge V2 - QA Executor
 * Orquestra execução completa do sistema de QA inteligente
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
exports.executeQA = executeQA;
exports.executeQuickQA = executeQuickQA;
exports.generateQAReport = generateQAReport;
const qa_engine_1 = require("./qa-engine");
const bug_fix_loop_1 = require("./bug-fix-loop");
const validators = __importStar(require("./validators"));
// ============================================================================
// MAIN EXECUTOR
// ============================================================================
async function executeQA(config) {
    const startTime = Date.now();
    console.log('🚀 DevForge V2 - QA Engine iniciado\n');
    // 1. Gerar checklist adaptativa baseada no PRD
    console.log('📋 Gerando checklist adaptativa...');
    const checklist = (0, qa_engine_1.generateAdaptiveChecklist)(config.prd);
    console.log(`✅ ${checklist.length} checks identificados`);
    console.log(`⏱️  Tempo estimado: ${(0, qa_engine_1.estimateTotalTime)(checklist)} minutos\n`);
    // Mostrar breakdown por categoria
    const byCategory = (0, qa_engine_1.groupChecksByCategory)(checklist);
    console.log('📊 Breakdown por categoria:');
    for (const [category, checks] of Object.entries(byCategory)) {
        console.log(`   ${category}: ${checks.length} checks`);
    }
    console.log('');
    // 2. Inicializar browser
    console.log('🌐 Inicializando browser Playwright...');
    const browser = await (0, qa_engine_1.initBrowser)(config.headless ?? true);
    // 3. Executar validações
    console.log('\n🔍 Executando validações...\n');
    const validationResults = [];
    const automatableChecks = (0, qa_engine_1.getAutomatableChecks)(checklist);
    for (let i = 0; i < automatableChecks.length; i++) {
        const check = automatableChecks[i];
        console.log(`[${i + 1}/${automatableChecks.length}] ${check.description}...`);
        try {
            const validator = validators[check.validator];
            if (!validator) {
                console.log(`   ⚠️  Validator ${check.validator} não encontrado`);
                continue;
            }
            const result = await validator(browser, config.projectPath, config.deployUrl);
            validationResults.push(result);
            if (result.passed) {
                console.log(`   ✅ PASSOU (${result.executionTime}ms)`);
            }
            else {
                console.log(`   ❌ FALHOU - ${result.bugs.length} bug(s) encontrado(s)`);
                for (const bug of result.bugs.slice(0, 2)) {
                    console.log(`      • [${bug.severity}] ${bug.title}`);
                }
            }
        }
        catch (error) {
            console.log(`   💥 ERRO: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    console.log('');
    // 4. Agregar bugs
    const allBugs = validationResults.flatMap(r => r.bugs);
    const passed = validationResults.filter(r => r.passed).length;
    const failed = validationResults.filter(r => !r.passed).length;
    console.log('📊 Resultados:');
    console.log(`   ✅ Passou: ${passed}`);
    console.log(`   ❌ Falhou: ${failed}`);
    console.log(`   🐛 Total bugs: ${allBugs.length}\n`);
    // 5. Calcular score
    const score = (0, qa_engine_1.calculateQAScore)(allBugs);
    score.passed = passed;
    score.failed = failed;
    console.log('🎯 QA Score:');
    console.log(`   Total: ${score.total}/${score.maxPossible} (${score.percentage}%)`);
    console.log(`   Breakdown:`);
    console.log(`      CRITICAL: ${score.breakdown.critical}`);
    console.log(`      HIGH: ${score.breakdown.high}`);
    console.log(`      MEDIUM: ${score.breakdown.medium}`);
    console.log(`      LOW: ${score.breakdown.low}`);
    if (score.blockers.length > 0) {
        console.log(`\n⚠️  ${score.blockers.length} BLOCKER(S) CRÍTICO(S):`);
        for (const blocker of score.blockers.slice(0, 5)) {
            console.log(`   • ${blocker.title}`);
        }
    }
    console.log('');
    // 6. Auto-fix (se ativado)
    let autoFixResults;
    if (config.autoFix && allBugs.length > 0) {
        console.log('🔧 Iniciando auto-fix de bugs...\n');
        autoFixResults = await (0, bug_fix_loop_1.runBatchBugFix)(allBugs, checklist, {
            maxIterations: 10,
            ollamaModel: 'qwen2.5-coder:14b',
            ollamaEndpoint: config.ollamaEndpoint || 'http://localhost:11434',
            claudeApiKey: config.claudeApiKey,
            projectPath: config.projectPath,
            deployUrl: config.deployUrl,
            browser,
        });
        const fixed = autoFixResults.filter(r => r.fixed).length;
        console.log(`\n✅ ${fixed}/${allBugs.length} bugs corrigidos automaticamente`);
    }
    // 7. Fechar browser
    await browser.close();
    const executionTime = Date.now() - startTime;
    console.log(`\n⏱️  Tempo total: ${(executionTime / 1000).toFixed(2)}s`);
    console.log('✅ QA completo!\n');
    return {
        checklist,
        validationResults,
        allBugs,
        score,
        executionTime,
        timestamp: new Date(),
        autoFixResults,
    };
}
// ============================================================================
// QUICK CHECKS (APENAS CRÍTICOS)
// ============================================================================
async function executeQuickQA(config) {
    console.log('⚡ DevForge V2 - Quick QA (apenas checks críticos)\n');
    const fullChecklist = (0, qa_engine_1.generateAdaptiveChecklist)(config.prd);
    const criticalChecks = (0, qa_engine_1.getCriticalChecks)(fullChecklist);
    console.log(`🔍 ${criticalChecks.length} checks críticos identificados\n`);
    // Executar apenas checks críticos
    const modifiedConfig = { ...config };
    const browser = await (0, qa_engine_1.initBrowser)(config.headless ?? true);
    const validationResults = [];
    for (let i = 0; i < criticalChecks.length; i++) {
        const check = criticalChecks[i];
        console.log(`[${i + 1}/${criticalChecks.length}] ${check.description}...`);
        try {
            const validator = validators[check.validator];
            if (!validator) {
                console.log(`   ⚠️  Validator não encontrado`);
                continue;
            }
            const result = await validator(browser, config.projectPath, config.deployUrl);
            validationResults.push(result);
            console.log(result.passed ? '   ✅ PASSOU' : `   ❌ FALHOU`);
        }
        catch (error) {
            console.log(`   💥 ERRO`);
        }
    }
    await browser.close();
    const allBugs = validationResults.flatMap(r => r.bugs);
    const score = (0, qa_engine_1.calculateQAScore)(allBugs);
    score.passed = validationResults.filter(r => r.passed).length;
    score.failed = validationResults.filter(r => !r.passed).length;
    console.log(`\n🎯 Quick QA Score: ${score.total}/${score.maxPossible} (${score.percentage}%)`);
    return {
        checklist: criticalChecks,
        validationResults,
        allBugs,
        score,
        executionTime: 0,
        timestamp: new Date(),
    };
}
// ============================================================================
// GENERATE REPORT
// ============================================================================
function generateQAReport(result) {
    let report = `# DevForge V2 - QA Report\n\n`;
    report += `**Data:** ${result.timestamp.toLocaleString('pt-PT')}\n`;
    report += `**Tempo de execução:** ${(result.executionTime / 1000).toFixed(2)}s\n\n`;
    report += `## Score\n\n`;
    report += `- **Total:** ${result.score.total}/${result.score.maxPossible} (${result.score.percentage}%)\n`;
    report += `- **Passou:** ${result.score.passed} checks\n`;
    report += `- **Falhou:** ${result.score.failed} checks\n\n`;
    report += `### Breakdown por severidade\n\n`;
    report += `- CRITICAL: ${result.score.breakdown.critical}\n`;
    report += `- HIGH: ${result.score.breakdown.high}\n`;
    report += `- MEDIUM: ${result.score.breakdown.medium}\n`;
    report += `- LOW: ${result.score.breakdown.low}\n\n`;
    if (result.score.blockers.length > 0) {
        report += `## ⚠️ Blockers Críticos\n\n`;
        for (const blocker of result.score.blockers) {
            report += `### ${blocker.title}\n\n`;
            report += `- **ID:** ${blocker.id}\n`;
            report += `- **Severidade:** ${blocker.severity}\n`;
            report += `- **Descrição:** ${blocker.description}\n`;
            if (blocker.location) {
                report += `- **Localização:** ${blocker.location}\n`;
            }
            if (blocker.affectedFiles && blocker.affectedFiles.length > 0) {
                report += `- **Ficheiros:** ${blocker.affectedFiles.join(', ')}\n`;
            }
            report += `\n`;
        }
    }
    if (result.allBugs.length > 0) {
        report += `## Todos os Bugs\n\n`;
        const byCategory = result.allBugs.reduce((acc, bug) => {
            const severity = bug.severity;
            if (!acc[severity])
                acc[severity] = [];
            acc[severity].push(bug);
            return acc;
        }, {});
        for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
            const bugs = byCategory[severity] || [];
            if (bugs.length === 0)
                continue;
            report += `### ${severity} (${bugs.length})\n\n`;
            for (const bug of bugs) {
                report += `- **${bug.title}**\n`;
                report += `  - ${bug.description}\n`;
                if (bug.location) {
                    report += `  - Localização: ${bug.location}\n`;
                }
                report += `\n`;
            }
        }
    }
    if (result.autoFixResults && result.autoFixResults.length > 0) {
        report += `## Auto-Fix Resultados\n\n`;
        const fixed = result.autoFixResults.filter((r) => r.fixed).length;
        const total = result.autoFixResults.length;
        report += `**${fixed}/${total} bugs corrigidos automaticamente**\n\n`;
        for (const fixResult of result.autoFixResults) {
            const status = fixResult.fixed ? '✅' : '❌';
            report += `${status} ${fixResult.bug.title} (${fixResult.totalIterations} iterações)\n`;
        }
    }
    return report;
}
