const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const VERCEL_URL = 'https://frontend-one-xi-61.vercel.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-click-test');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🎯 TESTE: CLICAR NO CARD E VER DETALHES\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 400
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // Carregar página
    console.log('Passo 1: Carregar página');
    await page.goto(VERCEL_URL, { waitUntil: 'networkidle' });
    await sleep(3000);
    console.log('✅ Página carregada\n');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-dashboard.png'),
      fullPage: true
    });

    // Criar projeto primeiro
    console.log('Passo 2: Criar projeto de teste');
    await page.click('button:has-text("Novo Projecto")');
    await sleep(1000);

    const description = 'App de fitness com treinos personalizados e tracking de progresso';
    await page.fill('textarea', description);
    await sleep(500);

    await page.click('button:has-text("Criar Projecto")');
    await sleep(4000); // Esperar criação + re-render
    console.log('✅ Projeto criado\n');

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '02-projeto-criado.png'),
      fullPage: true
    });

    // Procurar QUALQUER card clicável
    console.log('Passo 3: Procurar cards na página');

    // Tentar vários seletores possíveis
    const selectors = [
      '.card[style*="cursor: pointer"]',
      '[class*="card"][onclick]',
      'div[style*="cursor: pointer"]',
      '.card',
    ];

    let clickableCard = null;

    for (const selector of selectors) {
      const elements = await page.locator(selector).all();
      console.log(`   Seletor "${selector}": ${elements.length} elementos`);

      if (elements.length > 0) {
        // Filtrar para encontrar cards de projeto (que não sejam stats)
        for (const el of elements) {
          const text = await el.textContent();
          if (text && text.includes('fitness') || text.includes('Intake')) {
            clickableCard = el;
            console.log(`   ✅ Card encontrado com texto: ${text.substring(0, 50)}...`);
            break;
          }
        }
      }

      if (clickableCard) break;
    }

    if (!clickableCard) {
      console.log('❌ Nenhum card clicável encontrado\n');

      // Debug: mostrar HTML da página
      const html = await page.content();
      fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'debug-page.html'), html);
      console.log('   HTML salvo em debug-page.html');

      await browser.close();
      return;
    }

    // Clicar no card
    console.log('\nPasso 4: Clicar no card');
    await clickableCard.scrollIntoViewIfNeeded();
    await sleep(500);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '03-antes-clicar.png'),
      fullPage: true
    });

    await clickableCard.click();
    console.log('✅ Clicou no card');

    await sleep(3000); // Esperar transição

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '04-apos-clicar.png'),
      fullPage: true
    });

    // Verificar se mudou de view
    console.log('\nPasso 5: Verificar mudança de view');

    const checks = {
      'Voltou ao dashboard': await page.isVisible('text=Os teus Projectos'),
      'View de projeto': await page.isVisible('text=Arquitetura') || await page.isVisible('text=Stack'),
      'Botão voltar': await page.isVisible('button:has-text("Voltar")'),
    };

    console.log('\n📊 RESULTADO:');
    for (const [name, found] of Object.entries(checks)) {
      console.log(`   ${found ? '✅' : '❌'} ${name}`);
    }

    if (checks['View de projeto']) {
      console.log('\n✅ NAVEGOU PARA VIEW DE PROJETO!\n');

      // Tirar screenshots da página de detalhes
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '05-detalhes-topo.png'),
        fullPage: true
      });

      await page.evaluate(() => window.scrollTo(0, 800));
      await sleep(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '06-detalhes-meio.png'),
        fullPage: true
      });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '07-detalhes-fim.png'),
        fullPage: true
      });
    } else {
      console.log('\n❌ NÃO NAVEGOU - ainda no dashboard\n');
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, 'ERROR.png'),
      fullPage: true
    });
  }

  await sleep(3000);
  await browser.close();
}

runTest().catch(console.error);
