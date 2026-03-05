#!/bin/bash

# DevForge V2 — FASE 8: Script de Testes Completo
# Executa todos os testes (backend + frontend) e gera relatório

set -e

BACKEND_DIR="/Users/diogoloureiro/devforge-v2/studio/backend"
FRONTEND_DIR="/Users/diogoloureiro/devforge-v2/studio/frontend"
REPORT_FILE="$BACKEND_DIR/tests/TEST_REPORT.md"

echo "========================================"
echo "DevForge V2 — FASE 8: Testes Completos"
echo "========================================"
echo ""

# Limpar report anterior
rm -f "$REPORT_FILE"

# Iniciar report
cat > "$REPORT_FILE" <<EOF
# DevForge V2 — Relatório de Testes (FASE 8)

**Data:** $(date '+%Y-%m-%d %H:%M:%S')
**Ambiente:** Desenvolvimento

---

## Sumário

EOF

# Verificar se backend está rodando
echo "[1/6] Verificando backend..."
BACKEND_RUNNING=$(curl -s http://localhost:5680 || echo "OFFLINE")

if [[ "$BACKEND_RUNNING" == "OFFLINE" ]]; then
  echo "❌ Backend não está rodando!"
  echo "   Execute: cd studio/backend && npm run dev"
  echo ""
  echo "**Status Backend:** ❌ OFFLINE" >> "$REPORT_FILE"
  exit 1
else
  echo "✅ Backend está rodando"
  echo "**Status Backend:** ✅ ONLINE" >> "$REPORT_FILE"
fi

# Verificar se frontend está rodando
echo "[2/6] Verificando frontend..."
FRONTEND_RUNNING=$(curl -s http://localhost:5679 || echo "OFFLINE")

if [[ "$FRONTEND_RUNNING" == "OFFLINE" ]]; then
  echo "⚠️  Frontend não está rodando (opcional para testes API)"
  echo "   Execute: cd studio/frontend && npm run dev"
  echo "**Status Frontend:** ⚠️  OFFLINE" >> "$REPORT_FILE"
else
  echo "✅ Frontend está rodando"
  echo "**Status Frontend:** ✅ ONLINE" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Executar testes de API
echo "[3/6] Executando testes Backend API..."
cd "$BACKEND_DIR"

echo "## 1. Testes Backend API" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if npm run test:api 2>&1 | tee -a "$REPORT_FILE"; then
  echo "✅ Testes API passaram"
  echo "" >> "$REPORT_FILE"
  echo "**Resultado:** ✅ PASSOU" >> "$REPORT_FILE"
else
  echo "❌ Testes API falharam"
  echo "" >> "$REPORT_FILE"
  echo "**Resultado:** ❌ FALHOU" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Executar testes E2E (apenas se frontend estiver rodando)
if [[ "$FRONTEND_RUNNING" != "OFFLINE" ]]; then
  echo "[4/6] Executando testes E2E (Playwright)..."

  echo "## 2. Testes E2E (Playwright)" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"

  if npm run test:e2e 2>&1 | tee -a "$REPORT_FILE"; then
    echo "✅ Testes E2E passaram"
    echo "" >> "$REPORT_FILE"
    echo "**Resultado:** ✅ PASSOU" >> "$REPORT_FILE"
  else
    echo "❌ Testes E2E falharam"
    echo "" >> "$REPORT_FILE"
    echo "**Resultado:** ❌ FALHOU" >> "$REPORT_FILE"
  fi
else
  echo "[4/6] ⏭️  Saltando testes E2E (frontend offline)"
  echo "## 2. Testes E2E (Playwright)" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "**Resultado:** ⏭️  SKIPPED (Frontend offline)" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Testes de Integração
if [[ "$FRONTEND_RUNNING" != "OFFLINE" ]]; then
  echo "[5/6] Executando testes de Integração..."

  echo "## 3. Testes de Integração" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"

  if npm run test:integration 2>&1 | tee -a "$REPORT_FILE"; then
    echo "✅ Testes de Integração passaram"
    echo "" >> "$REPORT_FILE"
    echo "**Resultado:** ✅ PASSOU" >> "$REPORT_FILE"
  else
    echo "❌ Testes de Integração falharam"
    echo "" >> "$REPORT_FILE"
    echo "**Resultado:** ❌ FALHOU" >> "$REPORT_FILE"
  fi
else
  echo "[5/6] ⏭️  Saltando testes de Integração (frontend offline)"
  echo "## 3. Testes de Integração" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "**Resultado:** ⏭️  SKIPPED (Frontend offline)" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Checklist manual reminder
echo "[6/6] Checklist Manual..."
echo "## 4. Checklist Manual" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Ver: \`tests/CHECKLIST_MANUAL.md\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Status:** ⏳ PENDENTE" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Finalizar report
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Conclusão" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "- ✅ Testes automatizados concluídos" >> "$REPORT_FILE"
echo "- ⏳ Checklist manual pendente" >> "$REPORT_FILE"
echo "- 📋 Ver bugs encontrados em \`tests/BUGS.md\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Exibir relatório
echo ""
echo "========================================"
echo "Relatório gerado: tests/TEST_REPORT.md"
echo "========================================"
echo ""
cat "$REPORT_FILE"

echo ""
echo "✅ Testes concluídos!"
echo ""
echo "Próximos passos:"
echo "1. Rever relatório: tests/TEST_REPORT.md"
echo "2. Completar checklist manual: tests/CHECKLIST_MANUAL.md"
echo "3. Corrigir bugs encontrados"
echo ""
