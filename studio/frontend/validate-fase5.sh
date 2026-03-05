#!/bin/bash

# DevForge V2 - FASE 5 Validation Script
# Valida que todos os componentes foram criados correctamente

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  DEVFORGE V2 - FASE 5 VALIDATION                          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Check function
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $1 (MISSING)"
    ((FAILED++))
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $1/"
    ((PASSED++))
  else
    echo -e "${RED}✗${NC} $1/ (MISSING)"
    ((FAILED++))
  fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 ESTRUTURA DE PASTAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_dir "src/components/layout"
check_dir "src/components/sprint"
check_dir "src/components/pipeline"
check_dir "src/components/team"
check_dir "src/components/chat"
check_dir "src/types"
check_dir "src/lib"
check_dir "src/styles"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧩 COMPONENTES DE LAYOUT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/components/layout/TitleBar.tsx"
check_file "src/components/layout/Sidebar.tsx"
check_file "src/components/layout/MainLayout.tsx"
check_file "src/components/layout/index.ts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 COMPONENTES DE SPRINT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/components/sprint/SprintHeader.tsx"
check_file "src/components/sprint/FeatureCard.tsx"
check_file "src/components/sprint/KanbanColumn.tsx"
check_file "src/components/sprint/SprintBoard.tsx"
check_file "src/components/sprint/index.ts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 COMPONENTES DE PIPELINE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/components/pipeline/PhaseNode.tsx"
check_file "src/components/pipeline/PipelineTimeline.tsx"
check_file "src/components/pipeline/LiveLogs.tsx"
check_file "src/components/pipeline/index.ts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👥 COMPONENTES DE TEAM"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/components/team/TeamPanel.tsx"
check_file "src/components/team/ActivityFeed.tsx"
check_file "src/components/team/index.ts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💬 COMPONENTES DE CHAT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/components/chat/PMIntakeChat.tsx"
check_file "src/components/chat/index.ts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 TYPES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/types/sprint.ts"
check_file "src/types/pipeline.ts"
check_file "src/types/team.ts"
check_file "src/types/chat.ts"
check_file "src/types/index.ts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 PÁGINAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/pages/ProjectViewNew.tsx"
check_file "src/pages/DesignSystemDemo.tsx"
check_file "src/App.demo.tsx"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 ESTILOS & UTILITÁRIOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "src/styles/design-system.css"
check_file "src/lib/mockData.ts"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📖 DOCUMENTAÇÃO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_file "README_FASE5.md"
check_file "FASE5_INDEX.md"
check_file "FASE5_RESUMO.md"
check_file "FASE5_COMPONENTS.md"
check_file "FASE5_CHECKLIST.md"
check_file "FASE5_SNIPPETS.md"
check_file "FASE5_SUMMARY.txt"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 RESULTADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Total verificado: $((PASSED + FAILED))"
echo -e "${GREEN}Passou: $PASSED${NC}"
echo -e "${RED}Falhou: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ FASE 5: 100% COMPLETA${NC}"
  echo ""
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║  Todos os componentes foram criados correctamente!    ║"
  echo "║  Ready for Backend Integration (FASE 6)               ║"
  echo "╚═══════════════════════════════════════════════════════╝"
  exit 0
else
  echo -e "${RED}✗ FASE 5: INCOMPLETA${NC}"
  echo ""
  echo "Alguns ficheiros estão em falta. Verificar acima."
  exit 1
fi
