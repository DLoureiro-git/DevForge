#!/usr/bin/env tsx
/**
 * DevForge V2 - QA Runner Script
 * Script executável para rodar QA via CLI
 */

import { executeQA, executeQuickQA, generateQAReport } from '../src/services/qa-executor';
import { writeFileSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CLI ARGS
// ============================================================================

const args = process.argv.slice(2);

const config = {
  mode: args[0] || 'full', // full | quick
  projectPath: args[1] || process.cwd(),
  deployUrl: args[2],
  prd: args[3] || 'Sistema web completo',
  autoFix: args.includes('--fix'),
  headless: !args.includes('--show'),
};

console.log('\n🚀 DevForge V2 - QA Runner\n');
console.log('Configuração:');
console.log(`  Mode: ${config.mode}`);
console.log(`  Project: ${config.projectPath}`);
console.log(`  Deploy URL: ${config.deployUrl || 'N/A'}`);
console.log(`  Auto-fix: ${config.autoFix ? 'SIM' : 'NÃO'}`);
console.log(`  Headless: ${config.headless ? 'SIM' : 'NÃO'}`);
console.log('');

// ============================================================================
// EXECUTE
// ============================================================================

async function run() {
  let result;

  if (config.mode === 'quick') {
    result = await executeQuickQA({
      prd: config.prd,
      projectPath: config.projectPath,
      deployUrl: config.deployUrl,
      headless: config.headless,
    });
  } else {
    result = await executeQA({
      prd: config.prd,
      projectPath: config.projectPath,
      deployUrl: config.deployUrl,
      headless: config.headless,
      autoFix: config.autoFix,
      claudeApiKey: process.env.ANTHROPIC_API_KEY,
      ollamaEndpoint: process.env.OLLAMA_ENDPOINT || 'http://localhost:11434',
    });
  }

  // Gerar e guardar relatório
  const report = generateQAReport(result);
  const reportPath = join(config.projectPath, 'qa-report.md');
  writeFileSync(reportPath, report);

  console.log(`\n📄 Relatório guardado: ${reportPath}\n`);

  // Exit code baseado no resultado
  if (result.score.percentage >= 70 && result.score.blockers.length === 0) {
    console.log('✅ QA PASSOU\n');
    process.exit(0);
  } else {
    console.log('❌ QA FALHOU\n');
    process.exit(1);
  }
}

run().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
