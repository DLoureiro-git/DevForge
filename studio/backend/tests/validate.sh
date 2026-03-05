#!/bin/bash
#
# DevForge V2 - Validação Rápida da Suite de Testes
#
# Verifica se tudo está configurado correctamente
#

set -e

echo "🔍 DevForge V2 - Validação da Suite de Testes"
echo ""

ERRORS=0

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Verificar estrutura de ficheiros
echo "📁 Verificando ficheiros..."
REQUIRED_FILES=(
    "playwright.config.ts"
    "responsive.spec.ts"
    "forms.spec.ts"
    "buttons.spec.ts"
    "auth.spec.ts"
    "accessibility.spec.ts"
    "integration.spec.ts"
    "helpers.ts"
    "types.ts"
    "README.md"
    "SUMMARY.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_pass "$file existe"
    else
        check_fail "$file não encontrado"
    fi
done

echo ""

# Verificar package.json
echo "📦 Verificando package.json..."
if grep -q "@playwright/test" ../package.json; then
    check_pass "Playwright instalado"
else
    check_fail "Playwright não encontrado em package.json"
fi

if grep -q "axe-core" ../package.json; then
    check_pass "axe-core instalado"
else
    check_fail "axe-core não encontrado em package.json"
fi

if grep -q "\"test\":" ../package.json; then
    check_pass "Script 'test' configurado"
else
    check_fail "Script 'test' não encontrado"
fi

echo ""

# Verificar sintaxe TypeScript
echo "🔧 Verificando sintaxe TypeScript..."
if command -v tsc &> /dev/null; then
    if tsc --noEmit *.ts 2>/dev/null; then
        check_pass "Sintaxe TypeScript válida"
    else
        check_warn "Alguns erros TypeScript (pode ser normal se deps não instaladas)"
    fi
else
    check_warn "tsc não encontrado (executar 'npm install' primeiro)"
fi

echo ""

# Verificar Playwright instalado
echo "🎭 Verificando instalação Playwright..."
if [ -d "../node_modules/@playwright/test" ]; then
    check_pass "Playwright node_modules presente"
else
    check_warn "Playwright não instalado (executar 'npm install')"
fi

if command -v playwright &> /dev/null; then
    PLAYWRIGHT_VERSION=$(playwright --version | head -n1)
    check_pass "Playwright CLI: $PLAYWRIGHT_VERSION"
else
    check_warn "Playwright CLI não encontrado globalmente"
fi

echo ""

# Verificar browsers
echo "🌐 Verificando browsers Playwright..."
BROWSER_DIR="$HOME/.cache/ms-playwright"
if [ -d "$BROWSER_DIR" ] || [ -d "$HOME/Library/Caches/ms-playwright" ]; then
    check_pass "Browsers instalados"
else
    check_warn "Browsers não instalados (executar 'npx playwright install')"
fi

echo ""

# Verificar servidores
echo "🚀 Verificando servidores..."
FRONTEND_URL="${BASE_URL:-http://localhost:5679}"
BACKEND_URL="${API_URL:-http://localhost:5680}"

if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    check_pass "Frontend acessível em $FRONTEND_URL"
else
    check_warn "Frontend não está a correr em $FRONTEND_URL"
fi

if curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    check_pass "Backend acessível em $BACKEND_URL"
else
    check_warn "Backend não está a correr em $BACKEND_URL"
fi

echo ""

# Contar testes
echo "📊 Estatísticas da suite..."
TOTAL_SPECS=$(ls -1 *.spec.ts 2>/dev/null | wc -l | xargs)
TOTAL_TESTS=$(grep -h "test(" *.spec.ts 2>/dev/null | wc -l | xargs)
TOTAL_HELPERS=$(grep -h "^export async function\|^export function" helpers.ts 2>/dev/null | wc -l | xargs)

echo "   Ficheiros spec: $TOTAL_SPECS"
echo "   Testes individuais: $TOTAL_TESTS"
echo "   Helper functions: $TOTAL_HELPERS"
echo "   Viewports configurados: 5"
echo "   Execuções totais: $((TOTAL_TESTS * 5))"

echo ""

# Verificar tamanho
TOTAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
echo "   Tamanho total: $TOTAL_SIZE"

echo ""

# Resultado final
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ Validação passou! Suite pronta para usar.${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Próximos passos:"
    echo "  1. npm install               # Instalar deps"
    echo "  2. npx playwright install    # Instalar browsers"
    echo "  3. npm test                  # Executar testes"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ Validação falhou com $ERRORS erros.${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Corrigir erros acima e executar novamente."
    exit 1
fi
