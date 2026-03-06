const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VERCEL_URL = 'https://frontend-one-xi-61.vercel.app';
const BACKEND_URL = 'https://brilliant-appreciation-production.up.railway.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-final-test');

// Criar diretório para screenshots
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 TESTE FINAL DEFINITIVO - VERCEL + RAILWAY\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Limpar tudo - nova sessão
    storageState: undefined
  });

  const page = await context.newPage();

  // Array para armazenar erros
  const consoleErrors = [];
  const networkErrors = [];
  const corsErrors = [];

  // Monitorar console
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();

    if (type === 'error') {
      consoleErrors.push(text);
      console.log(`❌ Console Error: ${text}`);
    }

    if (text.includes('CORS') || text.includes('cors')) {
      corsErrors.push(text);
      console.log(`🚫 CORS Issue: ${text}`);
    }
  });

  // Monitorar network
  page.on('response', async response => {
    const url = response.url();
    const status = response.status();

    // Log todas as requests para o backend
    if (url.includes('brilliant-appreciation-production.up.railway.app')) {
      console.log(`📡 Backend Request: ${url}`);
      console.log(`   Status: ${status}`);

      try {
        const contentType = response.headers()['content-type'] || '';
        console.log(`   Content-Type: ${contentType}`);

        if (contentType.includes('application/json')) {
          const body = await response.text();
          console.log(`   Response: ${body.substring(0, 200)}...`);
        }
      } catch (e) {
        console.log(`   Error reading response: ${e.message}`);
      }
    }

    // Detectar erros
    if (status >= 400) {
      networkErrors.push(`${status} - ${url}`);
      console.log(`❌ Network Error: ${status} - ${url}`);
    }
  });

  try {
    console.log('\n📋 PASSO 1: Abrir URL Vercel');
    console.log(`URL: ${VERCEL_URL}\n`);

    await page.goto(VERCEL_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-page-load.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 1: Página carregada');

    // VALIDAÇÃO 1: Verificar se há erros no console
    console.log('\n📋 PASSO 2: Verificar Console Limpo');
    if (consoleErrors.length === 0) {
      console.log('✅ Console limpo - sem erros');
    } else {
      console.log(`❌ Erros no console (${consoleErrors.length}):`);
      consoleErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    if (corsErrors.length === 0) {
      console.log('✅ Sem erros CORS');
    } else {
      console.log(`❌ Erros CORS (${corsErrors.length}):`);
      corsErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    await sleep(1000);

    // VALIDAÇÃO 2: Verificar se dashboard carregou
    console.log('\n📋 PASSO 3: Verificar Dashboard');

    const dashboardVisible = await page.isVisible('text=Os teus Projectos');
    if (dashboardVisible) {
      console.log('✅ Dashboard visível');
    } else {
      console.log('❌ Dashboard não encontrado');
    }

    // Verificar stats
    const statsCards = await page.locator('.bg-white.p-6.rounded-lg').count();
    console.log(`   Stats cards: ${statsCards}`);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-dashboard.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 2: Dashboard');

    await sleep(1000);

    // PASSO 4: Criar novo projeto
    console.log('\n📋 PASSO 4: Criar Novo Projeto');

    const newProjectBtn = page.locator('button:has-text("Novo Projecto")');
    await newProjectBtn.click();
    console.log('✅ Clicou "Novo Projecto"');

    await sleep(1000);

    // Verificar modal
    const modalVisible = await page.isVisible('text=Criar Novo Projecto');
    if (modalVisible) {
      console.log('✅ Modal aberto');
    } else {
      console.log('❌ Modal não apareceu');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-modal-aberto.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 3: Modal aberto');

    await sleep(1000);

    // Preencher formulário
    console.log('\n📋 PASSO 5: Preencher Formulário');

    const projectDescription = 'Plataforma de delivery com tracking GPS e pagamentos online';

    const textarea = page.locator('textarea');
    await textarea.fill(projectDescription);
    console.log(`✅ Descrição preenchida: "${projectDescription}"`);

    await sleep(1000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-formulario-preenchido.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 4: Formulário preenchido');

    await sleep(1000);

    // Criar projeto
    console.log('\n📋 PASSO 6: Criar Projeto');

    const createBtn = page.locator('button:has-text("Criar Projecto")');

    // Esperar pela resposta da API
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/projects') && response.status() === 201,
      { timeout: 10000 }
    );

    await createBtn.click();
    console.log('✅ Clicou "Criar Projecto"');

    try {
      const response = await responsePromise;
      const data = await response.json();
      console.log('✅ Projeto criado com sucesso');
      console.log(`   Project ID: ${data.id}`);
      console.log(`   Name: ${data.name}`);
    } catch (e) {
      console.log(`❌ Erro ao criar projeto: ${e.message}`);
    }

    await sleep(2000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-projeto-criado.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 5: Após criação');

    // VALIDAÇÃO 3: Verificar se modal fechou
    console.log('\n📋 PASSO 7: Verificar Modal Fechou');

    const modalStillVisible = await page.isVisible('text=Criar Novo Projecto');
    if (!modalStillVisible) {
      console.log('✅ Modal fechou');
    } else {
      console.log('❌ Modal ainda está aberto');
    }

    await sleep(1000);

    // VALIDAÇÃO 4: Verificar se projeto aparece na lista
    console.log('\n📋 PASSO 8: Verificar Projeto na Lista');

    await sleep(2000); // Esperar re-render

    const projectCards = await page.locator('.bg-white.p-6.rounded-lg.border').count();
    console.log(`   Total de cards: ${projectCards}`);

    if (projectCards > 0) {
      console.log('✅ Projeto aparece na lista');

      // Tentar encontrar o card específico
      const projectCard = page.locator('.bg-white.p-6.rounded-lg.border').first();
      const projectName = await projectCard.locator('h3').textContent();
      console.log(`   Nome do projeto: ${projectName}`);
    } else {
      console.log('❌ Nenhum projeto na lista');
    }

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '06-lista-projetos.png'),
      fullPage: true
    });
    console.log('✅ Screenshot 6: Lista de projetos');

    await sleep(1000);

    // PASSO 9: Abrir detalhes do projeto
    console.log('\n📋 PASSO 9: Abrir Detalhes do Projeto');

    if (projectCards > 0) {
      const projectCard = page.locator('.bg-white.p-6.rounded-lg.border').first();
      await projectCard.click();
      console.log('✅ Clicou no projeto');

      await sleep(2000);

      const detailsVisible = await page.isVisible('text=Arquitetura');
      if (detailsVisible) {
        console.log('✅ Página de detalhes carregada');
      } else {
        console.log('❌ Página de detalhes não carregou');
      }

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07-detalhes-projeto.png'),
        fullPage: true
      });
      console.log('✅ Screenshot 7: Detalhes do projeto');

      await sleep(1000);

      // Scroll para ver tudo
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '08-detalhes-completo.png'),
        fullPage: true
      });
      console.log('✅ Screenshot 8: Detalhes completo');
    }

    // RELATÓRIO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RELATÓRIO FINAL DO TESTE');
    console.log('='.repeat(60));

    console.log('\n🔍 VALIDAÇÕES:');
    console.log(`   Console Errors: ${consoleErrors.length === 0 ? '✅' : '❌'} (${consoleErrors.length})`);
    console.log(`   CORS Errors: ${corsErrors.length === 0 ? '✅' : '❌'} (${corsErrors.length})`);
    console.log(`   Network Errors: ${networkErrors.length === 0 ? '✅' : '❌'} (${networkErrors.length})`);
    console.log(`   Dashboard Load: ${dashboardVisible ? '✅' : '❌'}`);
    console.log(`   Modal Open/Close: ${modalVisible && !modalStillVisible ? '✅' : '❌'}`);
    console.log(`   Project Created: ${projectCards > 0 ? '✅' : '❌'}`);

    if (consoleErrors.length > 0) {
      console.log('\n❌ ERROS NO CONSOLE:');
      consoleErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    if (networkErrors.length > 0) {
      console.log('\n❌ ERROS DE NETWORK:');
      networkErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
    }

    const allPassed = consoleErrors.length === 0 &&
                     corsErrors.length === 0 &&
                     networkErrors.length === 0 &&
                     dashboardVisible &&
                     projectCards > 0;

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 TESTE PASSOU 100% - SISTEMA FUNCIONANDO!');
    } else {
      console.log('⚠️  TESTE COM PROBLEMAS - VER ERROS ACIMA');
    }
    console.log('='.repeat(60));

    console.log(`\n📸 Screenshots salvos em: ${SCREENSHOTS_DIR}`);

    await sleep(5000);

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'ERROR.png'),
      fullPage: true
    });
    console.log('📸 Screenshot de erro salvo');
  }

  await browser.close();
}

runTest().catch(console.error);
