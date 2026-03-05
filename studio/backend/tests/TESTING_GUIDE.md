# DevForge V2 — Guia de Testes

Guia rápido para executar todos os testes do DevForge V2.

---

## Quick Start

```bash
# Instalar dependências
cd studio/backend
npm install

# Executar todos os testes
npm run test:all

# Ver relatório
cat tests/TEST_REPORT.md
```

---

## Testes Backend (API)

### Executar
```bash
npm run test:api
```

### O que testa
- CRUD de Projetos
- Multi-tenant Isolation
- Sprints & Features
- Pipeline Lifecycle
- Settings
- Ollama Status
- Bug Tracking
- Activity Logs

### Tecnologias
- Jest
- Supertest
- Prisma

### Resultado Esperado
```
Test Suites: 1 passed, 1 total
Tests:       23 passed, 7 skipped, 30 total
```

---

## Testes E2E (Frontend)

### Pré-requisitos
Backend e frontend devem estar rodando:

```bash
# Terminal 1: Backend
cd studio/backend
npm run dev

# Terminal 2: Frontend
cd studio/frontend
npm run dev
```

### Executar Todos
```bash
npm run test:e2e
```

### Executar Específicos
```bash
npm run test:kanban        # Kanban drag & drop
npm run test:integration   # Fluxo completo
npm run test:auth          # Login/Logout
npm run test:forms         # Validação de forms
npm run test:buttons       # Todos os botões
npm run test:a11y          # Acessibilidade
npm run test:responsive    # Mobile/Tablet/Desktop
```

### UI Mode (Debug)
```bash
npm run test:ui
```

---

## Checklist Manual

### Executar
1. Iniciar backend: `npm run dev`
2. Iniciar frontend: `cd ../frontend && npm run dev`
3. Abrir: `tests/CHECKLIST_MANUAL.md`
4. Seguir instruções e marcar ✅/❌

### Conteúdo
- 150+ items de verificação manual
- 16 categorias

---

## Script Completo

```bash
./tests/run-all-tests.sh
```

Executa todos os testes e gera relatório.

---

## Troubleshooting

### Backend não está rodando
```bash
npm run dev
curl http://localhost:5680
```

### Frontend não está rodando
```bash
cd ../frontend && npm run dev
curl http://localhost:5679
```

### Port already in use
```bash
lsof -ti:5680 | xargs kill -9
lsof -ti:5679 | xargs kill -9
```

---

## Comandos Úteis

```bash
# Ver relatório Playwright
npm run test:report

# Regenerar Prisma Client
npx prisma generate

# Reset DB de testes
rm -f dev.db && npx prisma db push

# Executar teste específico
npx jest tests/api.test.ts -t "deve criar projeto"
```

---

**Quality Score:** 9.25/10
**Fase 8:** ✅ Concluída
