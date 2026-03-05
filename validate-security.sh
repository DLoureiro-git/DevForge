#!/bin/bash

# DevForge V2 — Security Validation Script
# Verifica se todas as medidas de segurança estão implementadas

set -e

echo "🔒 DevForge V2 — Security Validation"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_DIR="studio/backend"
PASSED=0
FAILED=0

# Check if we're in the right directory
if [ ! -d "$BACKEND_DIR" ]; then
  echo -e "${RED}❌ Error: Must be run from DevForge V2 root directory${NC}"
  exit 1
fi

cd "$BACKEND_DIR"

echo "1️⃣  Verificando middleware de segurança..."

# Check multiTenant middleware
if grep -q "sanitizeInput" src/middleware/multiTenant.ts; then
  echo -e "${GREEN}✅ sanitizeInput() implementado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ sanitizeInput() NÃO encontrado${NC}"
  ((FAILED++))
fi

if grep -q "ensureProjectOwner" src/middleware/multiTenant.ts; then
  echo -e "${GREEN}✅ ensureProjectOwner() implementado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ ensureProjectOwner() NÃO encontrado${NC}"
  ((FAILED++))
fi

if grep -q "uuidSchema" src/middleware/multiTenant.ts; then
  echo -e "${GREEN}✅ UUID validation implementada${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ UUID validation NÃO encontrada${NC}"
  ((FAILED++))
fi

echo ""
echo "2️⃣  Verificando rate limiting..."

if grep -q "express-rate-limit" src/index.ts; then
  echo -e "${GREEN}✅ Rate limiting instalado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Rate limiting NÃO encontrado${NC}"
  ((FAILED++))
fi

if grep -q "authLimiter" src/index.ts; then
  echo -e "${GREEN}✅ Auth rate limiter configurado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Auth rate limiter NÃO configurado${NC}"
  ((FAILED++))
fi

echo ""
echo "3️⃣  Verificando headers de segurança..."

if grep -q "helmet" src/index.ts; then
  echo -e "${GREEN}✅ Helmet instalado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Helmet NÃO encontrado${NC}"
  ((FAILED++))
fi

if grep -q "contentSecurityPolicy" src/index.ts; then
  echo -e "${GREEN}✅ CSP configurado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ CSP NÃO configurado${NC}"
  ((FAILED++))
fi

echo ""
echo "4️⃣  Verificando rotas protegidas..."

# Check projects routes
if grep -q "requireAuth" src/routes/projects.ts; then
  echo -e "${GREEN}✅ Projects routes protegidas${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Projects routes NÃO protegidas${NC}"
  ((FAILED++))
fi

if grep -q "userId: req.user!.id" src/routes/projects.ts; then
  echo -e "${GREEN}✅ Projects filtradas por userId${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Projects NÃO filtradas por userId${NC}"
  ((FAILED++))
fi

# Check sprints routes
if grep -q "ensureProjectOwner" src/routes/sprints.ts; then
  echo -e "${GREEN}✅ Sprints protegidas por ownership${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Sprints NÃO protegidas${NC}"
  ((FAILED++))
fi

# Check features routes
if grep -q "ensureProjectOwner" src/routes/features.ts; then
  echo -e "${GREEN}✅ Features protegidas por ownership${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Features NÃO protegidas${NC}"
  ((FAILED++))
fi

# Check team routes
if grep -q "ensureProjectOwner" src/routes/team.ts; then
  echo -e "${GREEN}✅ Team routes protegidas por ownership${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Team routes NÃO protegidas${NC}"
  ((FAILED++))
fi

# Check settings routes
if grep -q "userId: req.user!.id" src/routes/settings.ts; then
  echo -e "${GREEN}✅ Settings filtradas por userId${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Settings NÃO filtradas por userId${NC}"
  ((FAILED++))
fi

echo ""
echo "5️⃣  Verificando masking de dados sensíveis..."

if grep -q "anthropicKey.*slice(-4)" src/routes/settings.ts; then
  echo -e "${GREEN}✅ API Keys mascaradas${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ API Keys NÃO mascaradas${NC}"
  ((FAILED++))
fi

echo ""
echo "6️⃣  Verificando dependencies de segurança..."

if npm list express-rate-limit &>/dev/null; then
  echo -e "${GREEN}✅ express-rate-limit instalado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ express-rate-limit NÃO instalado${NC}"
  ((FAILED++))
fi

if npm list helmet &>/dev/null; then
  echo -e "${GREEN}✅ helmet instalado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ helmet NÃO instalado${NC}"
  ((FAILED++))
fi

if npm list validator &>/dev/null; then
  echo -e "${GREEN}✅ validator instalado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ validator NÃO instalado${NC}"
  ((FAILED++))
fi

if npm list zod &>/dev/null; then
  echo -e "${GREEN}✅ zod instalado${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ zod NÃO instalado${NC}"
  ((FAILED++))
fi

echo ""
echo "7️⃣  Verificando testes de segurança..."

if [ -f "tests/security.test.ts" ]; then
  echo -e "${GREEN}✅ Testes de segurança criados${NC}"
  ((PASSED++))
else
  echo -e "${RED}❌ Testes de segurança NÃO encontrados${NC}"
  ((FAILED++))
fi

echo ""
echo "===================================="
echo "📊 Resultados:"
echo "   ✅ Passou: $PASSED"
echo "   ❌ Falhou: $FAILED"
echo "===================================="

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 TODAS AS VERIFICAÇÕES PASSARAM!${NC}"
  echo ""
  echo "Sistema está SEGURO para multi-tenant."
  echo ""
  echo "Próximos passos:"
  echo "  1. npm run test:security (executar testes)"
  echo "  2. Revisar SECURITY-AUDIT.md"
  echo "  3. Deploy staging com HTTPS"
  exit 0
else
  echo -e "${RED}⚠️  ALGUMAS VERIFICAÇÕES FALHARAM${NC}"
  echo ""
  echo "Corrigir os problemas acima antes de prosseguir."
  exit 1
fi
