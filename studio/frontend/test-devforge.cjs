const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://perceptive-possibility-production-f87c.up.railway.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

// Criar directório para screenshots
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testDevForge() {
  console.log('🚀 Iniciando teste da aplicação DevForge V2...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Capturar erros do console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  // Capturar erros de rede
  page.on('pageerror', err => {
    console.log('❌ Page Error:', err.message);
  });

  try {
    // Passo 1: Abrir a aplicação
    console.log('📍 Passo 1: Abrindo a aplicação...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);

    // Passo 2 e 3: Verificar dashboard e tirar screenshot
    console.log('📍 Passo 2-3: Verificando dashboard e tirando screenshot...');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-dashboard-inicial.png'),
      fullPage: true
    });
    console.log('✅ Screenshot do dashboard salvo\n');

    // Verificar se o botão "Novo Projecto" existe
    const novoBotao = await page.locator('button:has-text("Novo Projeto"), button:has-text("Novo Projecto"), button:has-text("New Project")').first();

    if (await novoBotao.count() === 0) {
      console.log('⚠️ Botão "Novo Projeto" não encontrado. Tentando localizar por outros selectores...');
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-debug-sem-botao.png') });

      // Listar todos os botões visíveis
      const allButtons = await page.locator('button').all();
      console.log(`\nEncontrados ${allButtons.length} botões na página:`);
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  - Botão ${i+1}: "${text?.trim()}"`);
      }
    }

    // Passo 4: Clicar no botão "Novo Projecto"
    console.log('📍 Passo 4: Clicando em "Novo Projeto"...');
    await novoBotao.click();
    await sleep(1500);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-modal-novo-projeto.png'),
      fullPage: true
    });
    console.log('✅ Modal de novo projeto aberto\n');

    // Passo 5: Preencher nome e descrição
    console.log('📍 Passo 5: Preenchendo nome e descrição...');
    const nomeProjeto = 'Sistema de Gestão de Tarefas';
    const descricao = 'App de gestão de tarefas para a minha equipa com lista de tarefas, prioridades e deadlines';

    // Preencher campo "Nome do Projeto" (primeiro input)
    const nomeField = await page.locator('input[type="text"]').first();
    await nomeField.fill(nomeProjeto);
    console.log('✅ Nome preenchido');

    // Preencher campo "Descrição" (textarea)
    const descField = await page.locator('textarea').first();
    await descField.fill(descricao);
    console.log('✅ Descrição preenchida');

    await sleep(1000);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-descricao-preenchida.png'),
      fullPage: true
    });
    console.log('✅ Campos preenchidos\n');

    // Passo 6: Clicar em "Criar Projecto"
    console.log('📍 Passo 6: Clicando em "Criar Projeto"...');

    // Tentar clicar directamente no botão usando evaluate e verificar estado
    const buttonInfo = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const criarBtn = buttons.find(btn =>
        btn.textContent.includes('Criar') ||
        btn.textContent.includes('Create') ||
        btn.textContent.includes('Gerar')
      );
      if (criarBtn) {
        const isDisabled = criarBtn.disabled || criarBtn.classList.contains('disabled');
        const hasClass = criarBtn.className;
        criarBtn.click();
        return { found: true, disabled: isDisabled, classes: hasClass };
      }
      return { found: false };
    });

    console.log('Info do botão:', buttonInfo);

    // Aguardar o projeto ser criado (pode demorar)
    console.log('⏳ Aguardando criação do projeto (pode demorar alguns segundos)...');
    await sleep(3000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-projeto-em-criacao.png'),
      fullPage: true
    });

    // Aguardar o modal fechar (overlay desaparecer)
    console.log('⏳ Aguardando modal fechar...');
    try {
      await page.waitForSelector('.fixed.inset-0.bg-black\\/50', { state: 'hidden', timeout: 60000 });
      console.log('✅ Modal fechado\n');
    } catch (e) {
      console.log('⚠️ Modal ainda visível, continuando...\n');
    }

    await sleep(2000);

    // Passo 7 e 8: Verificar lista e tirar screenshot
    console.log('📍 Passo 7-8: Verificando lista de projetos...');
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '05-lista-com-novo-projeto.png'),
      fullPage: true
    });
    console.log('✅ Screenshot da lista de projetos salvo\n');

    // Passo 9: Clicar no projeto criado
    console.log('📍 Passo 9: Procurando projeto criado...');

    // Tentar encontrar elemento clicável do projeto
    const projectElements = await page.locator('a, button, div[class*="cursor-pointer"]').all();
    console.log(`Total de elementos clicáveis: ${projectElements.length}`);

    // Procurar por elemento que contenha texto relacionado com tarefas
    let projectClicked = false;
    for (const el of projectElements) {
      const text = await el.textContent();
      if (text && (text.includes('tarefas') || text.includes('gestão') || text.includes('App de'))) {
        console.log('✅ Projeto encontrado, tentando clicar...');
        try {
          await el.click({ force: true, timeout: 5000 });
          projectClicked = true;
          await sleep(3000);

          // Passo 10: Screenshot da página de detalhes
          console.log('📍 Passo 10: Tirando screenshot da página de detalhes...');
          await page.screenshot({
            path: path.join(SCREENSHOTS_DIR, '06-detalhes-projeto.png'),
            fullPage: true
          });
          console.log('✅ Screenshot dos detalhes do projeto salvo\n');
          break;
        } catch (e) {
          console.log('⚠️ Erro ao clicar, tentando próximo elemento...');
        }
      }
    }

    if (!projectClicked) {
      console.log('⚠️ Não foi possível clicar no projeto. Continuando...\n');
    }

    // Passo 11: Verificar links e botões
    console.log('📍 Passo 11: Verificando links e botões funcionais...');
    const allLinks = await page.locator('a').all();
    const allButtons = await page.locator('button').all();

    console.log(`\n📊 Estatísticas da página:`);
    console.log(`  - Total de links: ${allLinks.length}`);
    console.log(`  - Total de botões: ${allButtons.length}`);

    // Tirar screenshot final
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '07-teste-completo.png'),
      fullPage: true
    });

    console.log('\n✅ TESTE COMPLETO!');
    console.log(`\n📁 Screenshots salvos em: ${SCREENSHOTS_DIR}`);
    console.log('\nArquivos criados:');
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    files.forEach(file => console.log(`  - ${file}`));

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error.message);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '99-erro.png'),
      fullPage: true
    });
  } finally {
    await sleep(2000);
    await browser.close();
  }
}

testDevForge().catch(console.error);
