const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VERCEL_URL = 'https://frontend-one-xi-61.vercel.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-complete-flow');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 FLUXO COMPLETO: CRIAR + VER DETALHES\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // === PARTE 1: CRIAR PROJETO ===
    console.log('📋 PARTE 1: CRIAR PROJETO\n');

    console.log('Passo 1.1: Carregar página');
    await page.goto(VERCEL_URL, { waitUntil: 'networkidle' });
    await sleep(2000);
    console.log('✅ Página carregada');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-dashboard-inicial.png'),
      fullPage: true
    });

    console.log('\nPasso 1.2: Abrir modal');
    await page.click('button:has-text("Novo Projecto")');
    await sleep(1000);
    console.log('✅ Modal aberto');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-modal.png'),
      fullPage: true
    });

    console.log('\nPasso 1.3: Preencher formulário');
    const projectDescription = 'Sistema de gestão de restaurante com reservas online, menu digital e sistema de pedidos';
    await page.fill('textarea', projectDescription);
    await sleep(1000);
    console.log('✅ Formulário preenchido');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-formulario.png'),
      fullPage: true
    });

    console.log('\nPasso 1.4: Criar projeto');
    await page.click('button:has-text("Criar Projecto")');
    await sleep(3000); // Esperar criação + re-render
    console.log('✅ Projeto criado');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-projeto-criado.png'),
      fullPage: true
    });

    // === PARTE 2: ABRIR DETALHES ===
    console.log('\n📋 PARTE 2: VER DETALHES DO PROJETO\n');

    console.log('Passo 2.1: Procurar projeto na lista');

    // Esperar um pouco para garantir que re-renderizou
    await sleep(2000);

    // Procurar por qualquer card clicável
    const projectLinks = await page.locator('a[href^="/project/"]').all();
    console.log(`   Encontrados ${projectLinks.length} links de projeto`);

    if (projectLinks.length > 0) {
      console.log('✅ Projeto encontrado na lista');

      console.log('\nPasso 2.2: Clicar no projeto');
      await projectLinks[0].click();
      await sleep(3000);
      console.log('✅ Navegou para detalhes');

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '05-detalhes-topo.png'),
        fullPage: true
      });

      // Verificar se a página de detalhes carregou
      const url = page.url();
      console.log(`   URL atual: ${url}`);

      const hasProjectId = url.includes('/project/');
      if (hasProjectId) {
        console.log('✅ URL de detalhes correto');
      } else {
        console.log('❌ URL não é de detalhes');
      }

      // Scroll para ver diferentes seções
      console.log('\nPasso 2.3: Explorar página de detalhes');

      await page.evaluate(() => window.scrollTo(0, 500));
      await sleep(1000);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '06-detalhes-arquitetura.png'),
        fullPage: true
      });

      await page.evaluate(() => window.scrollTo(0, 1500));
      await sleep(1000);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07-detalhes-stack.png'),
        fullPage: true
      });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(1000);
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '08-detalhes-database.png'),
        fullPage: true
      });

      // Validar elementos presentes
      console.log('\nPasso 2.4: Validar elementos da página');

      const checks = {
        'Nome do projeto': await page.isVisible(`text=${projectDescription.substring(0, 30)}`),
        'Botão Voltar': await page.isVisible('button:has-text("Voltar")'),
        'Seção Arquitetura': await page.isVisible('text=Arquitetura'),
        'Seção Stack': await page.isVisible('text=Stack Tecnológica'),
        'Seção Database': await page.isVisible('text=Database Schema'),
        'Seção API': await page.isVisible('text=API Endpoints'),
      };

      console.log('\n📊 ELEMENTOS ENCONTRADOS:');
      for (const [name, found] of Object.entries(checks)) {
        console.log(`   ${found ? '✅' : '❌'} ${name}`);
      }

      // Voltar para dashboard
      console.log('\nPasso 2.5: Voltar ao dashboard');
      const backButton = page.locator('button:has-text("Voltar")');
      if (await backButton.isVisible()) {
        await backButton.click();
        await sleep(2000);
        console.log('✅ Voltou ao dashboard');

        await page.screenshot({
          path: path.join(SCREENSHOTS_DIR, '09-dashboard-final.png'),
          fullPage: true
        });
      }

    } else {
      console.log('❌ Nenhum projeto encontrado na lista');

      // Debug
      const bodyText = await page.textContent('body');
      console.log('\n📄 Conteúdo da página:');
      console.log(bodyText.substring(0, 300));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE COMPLETO FINALIZADO');
    console.log('='.repeat(60));
    console.log(`\n📸 Screenshots: ${SCREENSHOTS_DIR}`);

    await sleep(3000);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'ERROR.png'),
      fullPage: true
    });
  }

  await browser.close();
}

runTest().catch(console.error);
