const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const VERCEL_URL = 'https://frontend-one-xi-61.vercel.app';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-details');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🔍 TESTE: ABRIR DETALHES DO PROJETO\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('📋 PASSO 1: Carregar dashboard');
    await page.goto(VERCEL_URL, { waitUntil: 'networkidle' });
    await sleep(2000);

    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, '01-dashboard.png'),
      fullPage: true
    });
    console.log('✅ Dashboard carregado');

    // Procurar por qualquer card de projeto
    console.log('\n📋 PASSO 2: Encontrar projeto');

    // Esperar por cards de projeto
    await page.waitForSelector('[class*="bg-"][class*="p-"][class*="rounded"]', { timeout: 5000 });

    const projectCards = await page.locator('[class*="bg-"][class*="p-"][class*="rounded"]').all();
    console.log(`   Encontrados ${projectCards.length} elementos na página`);

    // Procurar especificamente por cards que contenham texto de projeto
    const projectCard = page.locator('text=Plataforma de delivery').first();
    const isVisible = await projectCard.isVisible();

    if (isVisible) {
      console.log('✅ Card do projeto encontrado');

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '02-antes-clicar.png'),
        fullPage: true
      });

      console.log('\n📋 PASSO 3: Clicar no projeto');
      await projectCard.click();
      await sleep(3000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '03-detalhes-inicial.png'),
        fullPage: true
      });
      console.log('✅ Página de detalhes aberta');

      // Scroll para ver tudo
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
      await sleep(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '04-detalhes-meio.png'),
        fullPage: true
      });

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await sleep(1000);

      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, '05-detalhes-fim.png'),
        fullPage: true
      });
      console.log('✅ Screenshots completos');

      // Verificar elementos da página
      console.log('\n📋 PASSO 4: Validar elementos');

      const hasArquitetura = await page.isVisible('text=Arquitetura');
      const hasStack = await page.isVisible('text=Stack Tecnológica');
      const hasDatabase = await page.isVisible('text=Database Schema');

      console.log(`   Arquitetura: ${hasArquitetura ? '✅' : '❌'}`);
      console.log(`   Stack: ${hasStack ? '✅' : '❌'}`);
      console.log(`   Database: ${hasDatabase ? '✅' : '❌'}`);

    } else {
      console.log('❌ Card do projeto não está visível');

      // Debug: mostrar o que está na página
      const bodyText = await page.locator('body').textContent();
      console.log('\n📄 Conteúdo da página:');
      console.log(bodyText.substring(0, 500));
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
