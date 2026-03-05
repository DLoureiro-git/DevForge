/**
 * DevForge V2 - QA System Usage Examples
 * Demonstra como usar o sistema de QA inteligente
 */
import { executeQA, executeQuickQA, generateQAReport } from './qa-executor';
import { writeFileSync } from 'fs';
import { join } from 'path';
// ============================================================================
// EXAMPLE 1: QA COMPLETO COM AUTO-FIX
// ============================================================================
async function runFullQA() {
    const prd = `
# PRD - Sistema de Gestão de Tarefas

## Funcionalidades
- Autenticação de utilizadores (login/signup)
- Dashboard com lista de tarefas
- Criar, editar, eliminar tarefas
- Filtros e pesquisa
- Notificações por email
- Interface responsiva (mobile-first)
- Sincronização em tempo real
- Upload de anexos

## Stack
- Next.js 14
- Supabase (Auth + Database + Storage + Realtime)
- Tailwind CSS
- TypeScript strict
- Resend (emails)
- Deploy: Vercel

## Requisitos Não-Funcionais
- Performance: TTI < 3s
- Mobile: 100% funcional em 375px+
- Segurança: rotas protegidas, sessions httpOnly
- Acessibilidade: WCAG AA
  `;
    const result = await executeQA({
        prd,
        projectPath: '/caminho/para/projeto',
        deployUrl: 'https://meu-app.vercel.app',
        headless: true,
        autoFix: true,
        claudeApiKey: process.env.ANTHROPIC_API_KEY,
        ollamaEndpoint: 'http://localhost:11434',
    });
    // Gerar relatório
    const report = generateQAReport(result);
    // Guardar relatório
    const reportPath = join(process.cwd(), 'qa-report.md');
    writeFileSync(reportPath, report);
    console.log(`📄 Relatório guardado em: ${reportPath}`);
    // Retornar resultado
    return result;
}
// ============================================================================
// EXAMPLE 2: QUICK QA (APENAS CHECKS CRÍTICOS)
// ============================================================================
async function runQuickCheck() {
    const prd = `
# PRD Simples - Landing Page

## Funcionalidades
- Hero section
- Features section
- Formulário de contacto
- Footer

## Stack
- Next.js 14
- Tailwind CSS
- Resend (emails)
- Deploy: Vercel
  `;
    const result = await executeQuickQA({
        prd,
        projectPath: '/caminho/para/landing-page',
        deployUrl: 'https://landing.vercel.app',
        headless: true,
    });
    console.log(`\n✅ Quick QA concluído: ${result.score.percentage}% score`);
    if (result.score.blockers.length > 0) {
        console.log(`\n⚠️  ATENÇÃO: ${result.score.blockers.length} blocker(s) crítico(s) encontrado(s)`);
    }
    return result;
}
// ============================================================================
// EXAMPLE 3: QA SEM AUTO-FIX (APENAS REPORTAR)
// ============================================================================
async function runReportOnly() {
    const prd = `
# PRD - E-commerce Simples

## Funcionalidades
- Listagem de produtos
- Carrinho de compras
- Checkout com Stripe
- Autenticação
- Painel admin

## Stack
- Next.js 14
- Prisma + PostgreSQL
- Stripe
- NextAuth.js
- Deploy: Railway
  `;
    const result = await executeQA({
        prd,
        projectPath: '/caminho/para/ecommerce',
        deployUrl: 'https://ecommerce.railway.app',
        headless: true,
        autoFix: false, // apenas reportar, sem corrigir
    });
    const report = generateQAReport(result);
    console.log('\n' + report);
    return result;
}
// ============================================================================
// EXAMPLE 4: QA COM BROWSER VISÍVEL (DEBUG)
// ============================================================================
async function runDebugQA() {
    const result = await executeQA({
        prd: 'Sistema de gestão',
        projectPath: '/caminho/para/projeto',
        deployUrl: 'http://localhost:3000',
        headless: false, // mostrar browser
        autoFix: false,
    });
    return result;
}
// ============================================================================
// EXAMPLE 5: INTEGRAÇÃO COM CI/CD
// ============================================================================
async function runCICD() {
    const prd = process.env.PRD || '';
    const projectPath = process.env.PROJECT_PATH || process.cwd();
    const deployUrl = process.env.DEPLOY_URL;
    const result = await executeQA({
        prd,
        projectPath,
        deployUrl,
        headless: true,
        autoFix: false,
    });
    // Exit code baseado no score
    if (result.score.percentage < 70) {
        console.error('❌ QA falhou: score abaixo de 70%');
        process.exit(1);
    }
    if (result.score.blockers.length > 0) {
        console.error('❌ QA falhou: blockers críticos encontrados');
        process.exit(1);
    }
    console.log('✅ QA passou: deploy pode prosseguir');
    process.exit(0);
}
// ============================================================================
// EXAMPLE 6: QA PROGRESSIVO (EXECUTAR POR CATEGORIA)
// ============================================================================
async function runProgressiveQA() {
    const prd = 'Sistema completo';
    const config = {
        prd,
        projectPath: '/caminho/para/projeto',
        deployUrl: 'https://app.vercel.app',
        headless: true,
        autoFix: false,
    };
    console.log('📊 QA Progressivo\n');
    // 1. Deploy checks (mais críticos)
    console.log('1️⃣ Deploy & Infraestrutura...');
    // executeQA com apenas checks de deploy...
    // 2. Security & Auth
    console.log('2️⃣ Segurança & Autenticação...');
    // executeQA com apenas checks de auth...
    // 3. Database
    console.log('3️⃣ Database & Persistência...');
    // executeQA com apenas checks de DB...
    // 4. UI/UX
    console.log('4️⃣ Interface & Responsividade...');
    // executeQA com apenas checks de UI...
    console.log('\n✅ QA Progressivo completo');
}
// ============================================================================
// EXPORT
// ============================================================================
export { runFullQA, runQuickCheck, runReportOnly, runDebugQA, runCICD, runProgressiveQA, };
// ============================================================================
// CLI EXECUTION
// ============================================================================
if (require.main === module) {
    const command = process.argv[2] || 'full';
    const commands = {
        full: runFullQA,
        quick: runQuickCheck,
        report: runReportOnly,
        debug: runDebugQA,
        ci: runCICD,
        progressive: runProgressiveQA,
    };
    const fn = commands[command];
    if (!fn) {
        console.error(`❌ Comando desconhecido: ${command}`);
        console.log('Comandos disponíveis: full, quick, report, debug, ci, progressive');
        process.exit(1);
    }
    fn()
        .then(() => {
        console.log('\n✅ Execução completa');
        process.exit(0);
    })
        .catch((error) => {
        console.error('\n❌ Erro:', error);
        process.exit(1);
    });
}
