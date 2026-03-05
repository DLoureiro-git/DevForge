# DevForge V2 - Suite de Testes Playwright

Suite completa de testes end-to-end para garantir qualidade do DevForge Studio.

## 📦 Instalação

```bash
cd ~/devforge-v2/studio/backend

# Instalar dependências
npm install

# Instalar browsers do Playwright
npx playwright install
```

## 🚀 Executar Testes

```bash
# Todos os testes em todos os viewports
npm test

# UI Mode (recomendado para desenvolvimento)
npm run test:ui

# Testes específicos
npm run test:responsive
npm run test:forms
npm run test:buttons
npm run test:auth
npm run test:a11y

# Debug mode (abre browser com DevTools)
npm run test:debug

# Headed mode (ver browser durante testes)
npm run test:headed

# Ver relatório HTML
npm run test:report
```

## 📁 Estrutura

```
tests/
├── playwright.config.ts      # Config: 5 viewports (375-1920px)
├── responsive.spec.ts         # Testes de responsividade
├── forms.spec.ts              # Testes de formulários
├── buttons.spec.ts            # Testes de botões e links
├── auth.spec.ts               # Testes de autenticação
├── accessibility.spec.ts      # Testes a11y (axe-core)
└── README.md                  # Este ficheiro
```

## 🎯 O Que é Testado

### Responsividade (`responsive.spec.ts`)
- ✅ Zero scroll horizontal em todos os viewports
- ✅ Touch targets ≥44x44px (mobile/tablet)
- ✅ Texto ≥12px
- ✅ Imagens com dimensões definidas
- ✅ Modais cabem no viewport
- ✅ Pipeline horizontal (≥1024px) / vertical (<1024px)

### Formulários (`forms.spec.ts`)
- ✅ Validação de campos obrigatórios
- ✅ Erros de servidor exibidos correctamente
- ✅ Form desactivado durante submit
- ✅ Feedback de sucesso
- ✅ Form limpo após sucesso

### Botões (`buttons.spec.ts`)
- ✅ Zero botões sem handler
- ✅ Links internos funcionam (sem 404s)
- ✅ Loading states visíveis
- ✅ Confirmações em acções destrutivas
- ✅ Cursor pointer + hover states
- ✅ Visual claro para botões disabled

### Autenticação (`auth.spec.ts`)
- ✅ Rotas protegidas redirecionam
- ✅ Login/logout funcionam
- ✅ Tokens expirados tratados
- ✅ Sessão persiste após refresh
- ✅ Erros de login exibidos
- ✅ User info visível

### Acessibilidade (`accessibility.spec.ts`)
- ✅ Zero violations críticas (axe-core)
- ✅ Imagens com alt text
- ✅ Inputs com labels
- ✅ Estrutura semântica (h1, main, etc.)
- ✅ Contraste adequado
- ✅ Focus visible
- ✅ Lang attribute
- ✅ Botões ícone com aria-label

## 🔧 Viewports Testados

| Viewport | Dimensão | Device |
|----------|----------|--------|
| mobile-375 | 375x667 | iPhone SE |
| tablet-768 | 768x1024 | iPad Mini |
| desktop-1024 | 1024x768 | Small Desktop |
| desktop-1280 | 1280x720 | Standard Desktop |
| desktop-1920 | 1920x1080 | Large Desktop |

## 📊 Relatórios

Após executar os testes:

```bash
# HTML report (navegador)
npm run test:report

# JSON report
cat test-results.json | jq
```

## 🐛 Troubleshooting

### Frontend não está a correr
```bash
# Terminal 1
cd ~/devforge-v2/studio/frontend
npm run dev

# Terminal 2
cd ~/devforge-v2/studio/backend
npm test
```

### Alterar Base URL
```bash
BASE_URL=http://localhost:3000 npm test
```

### Testes falhando
```bash
# Ver traces
npx playwright show-trace trace.zip

# Screenshots em test-results/
ls test-results/
```

## 📝 Adicionar Novos Testes

1. Criar ficheiro `*.spec.ts` na pasta `tests/`
2. Importar `@playwright/test`
3. Usar helpers existentes (ver `accessibility.spec.ts`)
4. Executar: `npm test`

Exemplo:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Minha Feature', () => {
  test('deve funcionar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## 🎓 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Axe-core](https://github.com/dequelabs/axe-core)

## 📄 Licença

MIT
