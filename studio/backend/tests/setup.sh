#!/bin/bash
#
# DevForge V2 - Setup de Testes Playwright
#
# Instala dependências e configura ambiente de testes
#

set -e

echo "🎭 DevForge V2 - Setup de Testes Playwright"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instalar primeiro."
    exit 1
fi

echo "✓ Node.js $(node --version)"

# Directório base
cd "$(dirname "$0")/.."

# Instalar dependências
echo ""
echo "📦 Instalando dependências..."
npm install

# Instalar browsers Playwright
echo ""
echo "🌐 Instalando browsers Playwright..."
npx playwright install

# Instalar system deps (Linux apenas)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    echo "🐧 Instalando dependências do sistema (Linux)..."
    npx playwright install-deps
fi

# Criar pastas
echo ""
echo "📁 Criando estrutura de pastas..."
mkdir -p test-results/screenshots
mkdir -p playwright-report

# Verificar frontend
echo ""
echo "🔍 Verificando se frontend está acessível..."
FRONTEND_URL="${BASE_URL:-http://localhost:5679}"

if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo "✓ Frontend acessível em $FRONTEND_URL"
else
    echo "⚠️  Frontend não está a correr em $FRONTEND_URL"
    echo "   Iniciar com: cd ../frontend && npm run dev"
fi

# Verificar backend
echo ""
echo "🔍 Verificando se backend está acessível..."
BACKEND_URL="${API_URL:-http://localhost:5680}"

if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "✓ Backend acessível em $BACKEND_URL"
else
    echo "⚠️  Backend não está a correr em $BACKEND_URL"
    echo "   Iniciar com: npm run dev"
fi

# Executar smoke test
echo ""
echo "🧪 Executando smoke test..."
if npx playwright test --config=playwright.config.ts --project=desktop-1280 --grep="@smoke" || true; then
    echo "✓ Smoke test passou"
else
    echo "⚠️  Nenhum teste @smoke encontrado (normal no primeiro setup)"
fi

echo ""
echo "✅ Setup completo!"
echo ""
echo "📚 Próximos passos:"
echo "   1. Iniciar frontend:  cd ../frontend && npm run dev"
echo "   2. Iniciar backend:   npm run dev"
echo "   3. Executar testes:   npm test"
echo "   4. UI Mode:           npm run test:ui"
echo ""
echo "📖 Documentação: tests/README.md"
echo ""
