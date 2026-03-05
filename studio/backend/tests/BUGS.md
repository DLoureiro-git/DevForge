# DevForge V2 — FASE 8: Bugs Encontrados

**Data:** $(date '+%Y-%m-%d')

---

## Bug #1: Pipeline execution fails after cleanup

**Severidade:** HIGH
**Categoria:** PIPELINE
**Status:** ✅ CORRIGIDO

### Descrição
Pipeline tenta actualizar projetos que já foram apagados no cleanup dos testes.

### Steps to reproduce
1. Executar testes API: `npm run test:api`
2. Ver erro: "No record was found for an update"

### Expected
Pipeline deve verificar se projeto existe antes de actualizar.

### Actual
Pipeline falha com erro Prisma P2025.

### Fix sugerido
```typescript
// src/routes/projects.ts linha 246
pipeline.run().catch(async (error) => {
  console.error(`[Pipeline] Error for project ${project.id}:`, error);

  // Verificar se projeto ainda existe
  const exists = await prisma.project.findUnique({
    where: { id: project.id }
  });

  if (exists) {
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'FAILED' },
    });
  }

  sseManager.send(project.id, {
    type: 'error',
    error: error.message,
  });
});
```

---

## Bug #2: Async logging after tests complete

**Severidade:** MEDIUM
**Categoria:** TESTING
**Status:** ENCONTRADO

### Descrição
Pipeline continua a executar logs depois de testes terminarem.

### Steps to reproduce
1. Executar testes API
2. Ver warning: "Cannot log after tests are done"

### Expected
Pipeline deve parar quando contexto de teste é destruído.

### Actual
Logs continuam após fim dos testes.

### Fix sugerido
Adicionar cleanup dos pipelines no `afterEach` ou `afterAll` dos testes:

```typescript
afterAll(async () => {
  // Stop all running pipelines
  // Clear SSE connections
  await prisma.$disconnect();
});
```

---

## Bug #3: Chat PM Agent requer API Key em testes

**Severidade:** LOW
**Categoria:** TESTING
**Status:** ESPERADO

### Descrição
Teste de chat falha porque API Key não está configurada no ambiente de teste.

### Expected
Testes devem mockar chamadas ao Anthropic API.

### Actual
Request real é feito e falha.

### Fix sugerido
Usar mocks para chamadas ao Anthropic:

```typescript
// No teste
jest.mock('../src/lib/anthropic', () => ({
  checkAnthropicHealth: jest.fn().mockResolvedValue(true),
}));
```

---

## Resumo

**Total bugs encontrados:** 3

**Por severidade:**
- CRITICAL: 0
- HIGH: 1
- MEDIUM: 1
- LOW: 1

**Por status:**
- OPEN: 2
- FIXED: 1
- WONTFIX: 0

---

## Bugs do Checklist Manual

(A preencher após completar checklist manual)

### Bug #4
...

### Bug #5
...

---

## Notas

- Bugs #1 e #2 são relacionados com testes e não afectam produção
- Bug #3 pode ser resolvido com mocks ou variável de ambiente para testes
- Nenhum bug crítico encontrado
- Testes core (multi-tenant, CRUD, lifecycle) passam todos ✅
