/**
 * DevForge V2 - QA Executor
 * Orquestra execução completa do sistema de QA inteligente
 */

import type { Browser } from 'playwright';
import type { Bug, QACheck, QAScore, ValidationResult } from './qa-engine';
import {
  generateAdaptiveChecklist,
  calculateQAScore,
  initBrowser,
  estimateTotalTime,
  groupChecksByCategory,
  getAutomatableChecks,
  getCriticalChecks,
} from './qa-engine';
import { runBatchBugFix } from './bug-fix-loop';
import * as validators from './validators';

// ============================================================================
// TYPES
// ============================================================================

export interface QAExecutionConfig {
  prd: string;
  projectPath: string;
  deployUrl?: string;
  headless?: boolean;
  autoFix?: boolean;
  claudeApiKey?: string;
  featureId?: string;
  acceptanceCriteria?: string[];
  ollamaEndpoint?: string;
}

export interface QAExecutionResult {
  checklist: QACheck[];
  validationResults: ValidationResult[];
  allBugs: Bug[];
  score: QAScore;
  executionTime: number;
  timestamp: Date;
  autoFixResults?: any[];
}

// ============================================================================
// MAIN EXECUTOR
// ============================================================================

export async function executeQA(config: QAExecutionConfig): Promise<QAExecutionResult> {
  const startTime = Date.now();

  console.log('🚀 DevForge V2 - QA Engine iniciado\n');

  // 1. Gerar checklist adaptativa baseada no PRD
  console.log('📋 Gerando checklist adaptativa...');
  const checklist = generateAdaptiveChecklist(config.prd);

  console.log(`✅ ${checklist.length} checks identificados`);
  console.log(`⏱️  Tempo estimado: ${estimateTotalTime(checklist)} minutos\n`);

  // Mostrar breakdown por categoria
  const byCategory = groupChecksByCategory(checklist);
  console.log('📊 Breakdown por categoria:');
  for (const [category, checks] of Object.entries(byCategory)) {
    console.log(`   ${category}: ${checks.length} checks`);
  }
  console.log('');

  // 2. Inicializar browser
  console.log('🌐 Inicializando browser Playwright...');
  const browser = await initBrowser(config.headless ?? true);

  // 3. Executar validações
  console.log('\n🔍 Executando validações...\n');

  const validationResults: ValidationResult[] = [];
  const automatableChecks = getAutomatableChecks(checklist);

  for (let i = 0; i < automatableChecks.length; i++) {
    const check = automatableChecks[i];

    console.log(`[${i + 1}/${automatableChecks.length}] ${check.description}...`);

    try {
      const validator = (validators as any)[check.validator];

      if (!validator) {
        console.log(`   ⚠️  Validator ${check.validator} não encontrado`);
        continue;
      }

      const result = await validator(browser, config.projectPath, config.deployUrl);
      validationResults.push(result);

      if (result.passed) {
        console.log(`   ✅ PASSOU (${result.executionTime}ms)`);
      } else {
        console.log(`   ❌ FALHOU - ${result.bugs.length} bug(s) encontrado(s)`);

        for (const bug of result.bugs.slice(0, 2)) {
          console.log(`      • [${bug.severity}] ${bug.title}`);
        }
      }

    } catch (error) {
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
  const score = calculateQAScore(allBugs);
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

    autoFixResults = await runBatchBugFix(allBugs, checklist, {
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

export async function executeQuickQA(config: QAExecutionConfig): Promise<QAExecutionResult> {
  console.log('⚡ DevForge V2 - Quick QA (apenas checks críticos)\n');

  const fullChecklist = generateAdaptiveChecklist(config.prd);
  const criticalChecks = getCriticalChecks(fullChecklist);

  console.log(`🔍 ${criticalChecks.length} checks críticos identificados\n`);

  // Executar apenas checks críticos
  const modifiedConfig = { ...config };

  const browser = await initBrowser(config.headless ?? true);
  const validationResults: ValidationResult[] = [];

  for (let i = 0; i < criticalChecks.length; i++) {
    const check = criticalChecks[i];

    console.log(`[${i + 1}/${criticalChecks.length}] ${check.description}...`);

    try {
      const validator = (validators as any)[check.validator];

      if (!validator) {
        console.log(`   ⚠️  Validator não encontrado`);
        continue;
      }

      const result = await validator(browser, config.projectPath, config.deployUrl);
      validationResults.push(result);

      console.log(result.passed ? '   ✅ PASSOU' : `   ❌ FALHOU`);

    } catch (error) {
      console.log(`   💥 ERRO`);
    }
  }

  await browser.close();

  const allBugs = validationResults.flatMap(r => r.bugs);
  const score = calculateQAScore(allBugs);
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

export function generateQAReport(result: QAExecutionResult): string {
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
      if (!acc[severity]) acc[severity] = [];
      acc[severity].push(bug);
      return acc;
    }, {} as Record<string, Bug[]>);

    for (const severity of ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']) {
      const bugs = byCategory[severity] || [];

      if (bugs.length === 0) continue;

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

    const fixed = result.autoFixResults.filter((r: any) => r.fixed).length;
    const total = result.autoFixResults.length;

    report += `**${fixed}/${total} bugs corrigidos automaticamente**\n\n`;

    for (const fixResult of result.autoFixResults) {
      const status = fixResult.fixed ? '✅' : '❌';
      report += `${status} ${fixResult.bug.title} (${fixResult.totalIterations} iterações)\n`;
    }
  }

  return report;
}
