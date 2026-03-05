const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND_URL = 'https://perceptive-possibility-production-f87c.up.railway.app';
const BACKEND_URL = 'https://brilliant-appreciation-production.up.railway.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

// Criar directório para screenshots
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDevForge() {
  console.log('🚀 DevForge V2 - Teste Completo\n');
  console.log(`📍 Frontend: ${FRONTEND_URL}`);
  console.log(`📍 Backend: ${BACKEND_URL}\n`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow motion para visualizar melhor
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // Capturar logs do console
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', text);
    }
  });

  // Capturar erros
  page.on('pageerror', err => {
    console.log('❌ Page Error:', err.message);
  });

  // Capturar requests de rede
  const networkRequests = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      networkRequests.push({
        method: req.method(),
        url: req.url(),
        timestamp: new Date().toISOString()
      });
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      const status = res.status();
      const method = res.request().method();
      const url = res.url();
      console.log(`📡 ${method} ${url} → ${status}`);

      if (status >= 400) {
        try {
          const body = await res.text();
          console.log(`   Response:`, body.substring(0, 200));
        } catch (e) {
          // Ignore
        }
      }
    }
  });

  try {
    console.log('\n═══════════════════════════════════════════\n');
    console.log('PASSO 1: VERIFICAR BACKEND\n');
    console.log('═══════════════════════════════════════════\n');

    // Testar backend health
    const healthCheck = await fetch(`${BACKEND_URL}/api/health`);
    const healthData = await healthCheck.json();
    console.log('Backend Status:', JSON.stringify(healthData, null, 2));

    console.log('\n═══════════════════════════════════════════\n');
    console.log('PASSO 2: ABRIR APLICAÇÃO\n');
    console.log('═══════════════════════════════════════════\n');

    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-dashboard-inicial.png'),
      fullPage: true
    });
    console.log('✅ Dashboard carregado e screenshot salvo\n');

    console.log('\n═══════════════════════════════════════════\n');
    console.log('PASSO 3: ABRIR MODAL NOVO PROJETO\n');
    console.log('═══════════════════════════════════════════\n');

    const novoBotao = await page.locator('button:has-text("Novo Projeto"), button:has-text("Novo Projecto")').first();
    await novoBotao.click();
    await sleep(1500);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-modal-novo-projeto.png'),
      fullPage: true
    });
    console.log('✅ Modal aberto\n');

    console.log('\n═══════════════════════════════════════════\n');
    console.log('PASSO 4: PREENCHER FORMULÁRIO\n');
    console.log('═══════════════════════════════════════════\n');

    const nomeProjeto = 'Sistema de Gestão de Tarefas';
    const descricao = 'App de gestão de tarefas para a minha equipa com lista de tarefas, prioridades e deadlines';

    const nomeField = await page.locator('input[type="text"]').first();
    await nomeField.fill(nomeProjeto);
    console.log(`✅ Nome preenchido: "${nomeProjeto}"`);

    const descField = await page.locator('textarea').first();
    await descField.fill(descricao);
    console.log(`✅ Descrição preenchida: "${descricao}"`);

    await sleep(1000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-formulario-preenchido.png'),
      fullPage: true
    });

    console.log('\n═══════════════════════════════════════════\n');
    console.log('PASSO 5: CRIAR PROJETO\n');
    console.log('═══════════════════════════════════════════\n');

    // Verificar estado do botão antes de clicar
    const buttonState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const criarBtn = buttons.find(btn => btn.textContent.includes('Criar'));
      if (criarBtn) {
        return {
          found: true,
          disabled: criarBtn.disabled,
          text: criarBtn.textContent.trim()
        };
      }
      return { found: false };
    });

    console.log('Estado do botão:', buttonState);

    // Clicar no botão
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const criarBtn = buttons.find(btn => btn.textContent.includes('Criar'));
      if (criarBtn) criarBtn.click();
    });

    console.log('✅ Botão "Criar Projeto" clicado');
    console.log('⏳ Aguardando resposta da API...\n');

    await sleep(3000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-projeto-criacao-iniciada.png'),
      fullPage: true
    });

    // Aguardar processamento
    console.log('⏳ Aguardando processamento (30 segundos)...\n');
    await sleep(30000);

    console.log('\n═══════════════════════════════════════════\n');
    console.log('PASSO 6: VERIFICAR RESULTADO\n');
    console.log('═══════════════════════════════════════════\n');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-resultado-final.png'),
      fullPage: true
    });

    // Verificar se modal ainda está aberto
    const modalAberto = await page.locator('.fixed.inset-0').count() > 0;
    console.log(`Modal ainda aberto: ${modalAberto ? 'Sim' : 'Não'}`);

    // Verificar se há projetos na lista
    const numProjetos = await page.locator('[class*="project"], [class*="card"]').count();
    console.log(`Número de projetos visíveis: ${numProjetos}`);

    console.log('\n═══════════════════════════════════════════\n');
    console.log('RELATÓRIO DE TESTES\n');
    console.log('═══════════════════════════════════════════\n');

    console.log('📊 Estatísticas:');
    console.log(`  - Requests API: ${networkRequests.length}`);
    console.log(`  - Erros Console: ${consoleLogs.filter(l => l.type === 'error').length}`);
    console.log(`  - Screenshots: ${fs.readdirSync(SCREENSHOTS_DIR).length}`);

    console.log('\n🌐 Requests realizados:');
    networkRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url.replace(BACKEND_URL, '')}`);
    });

    if (consoleLogs.filter(l => l.type === 'error').length > 0) {
      console.log('\n❌ Erros encontrados:');
      consoleLogs
        .filter(l => l.type === 'error')
        .forEach(log => console.log(`  - ${log.text}`));
    }

    console.log('\n✅ TESTE COMPLETO!');
    console.log(`\n📁 Screenshots em: ${SCREENSHOTS_DIR}`);

  } catch (error) {
    console.error('\n❌ ERRO DURANTE O TESTE:', error.message);
    console.error(error.stack);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '99-erro.png'),
      fullPage: true
    });
  } finally {
    console.log('\n⏳ Aguardando 5 segundos antes de fechar...');
    await sleep(5000);
    await browser.close();
  }
}

testDevForge().catch(console.error);
