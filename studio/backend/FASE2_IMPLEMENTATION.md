# DevForge V2 — FASE 2 Implementação

## Resumo
Implementação completa das routes de Sprints, Features e Team com middleware multi-tenant e serviço Scrum Master.

## Ficheiros Criados

### Middleware
- **`src/middleware/multiTenant.ts`**
  - `verifyProjectOwnership()` - Middleware para verificar ownership de projects
  - `ensureProjectOwner()` - Helper para validar ownership antes de queries
  - `ensureSprintOwner()` - Helper para validar ownership de sprints
  - `ensureBugOwner()` - Helper para validar ownership de bugs
  - `sanitizeInput()` - Sanitização de inputs para prevenir XSS
  - `sanitizeBody()` - Middleware para sanitizar body automaticamente
  - `injectUserFilter()` - Middleware genérico para injetar filtro userId
  - Validação de UUID format com zod
  - SEGURANÇA: Todas as queries filtram por userId automaticamente

### Routes

#### 1. **`src/routes/sprints.ts`**
- `GET /api/projects/:id/sprints` - Listar sprints do project
- `POST /api/projects/:id/sprints` - Criar novo sprint
- `PUT /api/projects/:id/sprints/:sid` - Atualizar sprint
- `POST /api/projects/:id/sprints/:sid/start` - Iniciar sprint (status: PLANNING → ACTIVE)
- `POST /api/projects/:id/sprints/:sid/end` - Terminar sprint (status: ACTIVE → DONE)
  - Calcula stats de completion
  - Actualiza deliveredPoints
  - Retorna métricas de velocity

#### 2. **`src/routes/features.ts`**
- `GET /api/projects/:id/features` - Listar features (filtros: status, sprint, assignedTo)
- `POST /api/projects/:id/features` - Criar feature
  - Auto-estimativa de story points via IA
  - Validação de team member
- `PUT /api/projects/:id/features/:fid` - Atualizar feature
  - Verifica WIP limit ao mover para IN_PROGRESS
- `DELETE /api/projects/:id/features/:fid` - Apagar feature
  - Remove comments e activity logs automaticamente
- `POST /api/projects/:id/features/:fid/start-build` - Iniciar build da feature
  - Verifica PRD e outputPath do project
  - Dispara Feature Pipeline em background
  - Auto-fix até 10 iterações
  - Target QA score: 95
- `POST /api/projects/:id/features/:fid/comment` - Adicionar comentário
  - Validação de author como team member

#### 3. **`src/routes/team.ts`**
- `GET /api/projects/:id/team` - Listar team members
- `POST /api/projects/:id/team` - Adicionar team member
  - Validação de roles: OWNER, PRODUCT_OWNER, DEVELOPER, STAKEHOLDER
  - Verifica duplicação de email
- `DELETE /api/projects/:id/team/:tid` - Remover team member
  - Impede remoção se tiver features ou comments

### Services

#### **`src/services/scrumMaster.ts`**
Serviço de IA para gestão Agile/Scrum usando Claude Sonnet 4.

**Métodos:**
1. **`generateDailyStandup(sprintId)`**
   - Gera daily standup baseado no estado actual do sprint
   - Retorna: completed, inProgress, blocked, warnings, recommendations
   - IA analisa riscos e dá recomendações

2. **`planSprint(projectId, number)`**
   - Planeia próximo sprint baseado no backlog
   - Usa velocity histórica (últimos 3 sprints)
   - Selecciona features que cabem na capacity
   - Retorna: goal, features[], totalStoryPoints, estimatedVelocity

3. **`sprintReview(sprintId)`**
   - Gera relatório de sprint review
   - Analisa features completadas vs planeadas
   - Retorna: highlights, improvements, nextSprintRecommendations

4. **`checkWIPLimit(projectId, targetStatus)`**
   - Verifica limites WIP por status
   - IN_PROGRESS: max 5 features
   - IN_REVIEW: max 3 features
   - IN_QA: max 3 features

5. **`estimateStoryPoints(feature)`**
   - Estima story points usando escala Fibonacci (1, 2, 3, 5, 8, 13)
   - Considera: complexity, effort, uncertainty
   - Default: 3 pontos

## Segurança Multi-Tenant

### Verificações Obrigatórias
Todas as routes implementam:
1. `requireAuth` middleware - Garante user autenticado
2. `ensureProjectOwner()` - Valida que user é owner do project
3. Queries sempre filtram por `userId: req.user!.id`
4. Validação de UUID format
5. Sanitização de inputs (XSS protection)

### Exemplo de Protecção
```typescript
const project = await prisma.project.findFirst({
  where: {
    id: projectId,
    userId: req.user!.id, // NUNCA retorna dados de outro user
  },
});

if (!project) {
  throw new AppError('Project not found or access denied', 404);
}
```

## Integração com Backend

### Registadas no `src/index.ts`
```typescript
import sprintsRoutes from './routes/sprints.js';
import featuresRoutes from './routes/features.js';
import teamRoutes from './routes/team.js';

app.use('/api/projects', sprintsRoutes);
app.use('/api/projects', featuresRoutes);
app.use('/api/projects', teamRoutes);
```

### Schema Prisma
Modelos utilizados:
- `Sprint` - Sprints do project (PLANNING, ACTIVE, REVIEW, DONE)
- `Feature` - Features/histórias (BACKLOG, READY, IN_PROGRESS, IN_REVIEW, IN_QA, DONE, BLOCKED)
- `TeamMember` - Membros da equipa do project
- `Comment` - Comentários em features
- `ActivityLog` - Logs de actividade

## Fluxo de Trabalho

### 1. Criar Project
```
POST /api/projects
→ PM Agent intake
→ PRD gerado
→ Full pipeline build
```

### 2. Adicionar Team
```
POST /api/projects/:id/team
```

### 3. Planear Sprint
```
POST /api/projects/:id/sprints
→ Scrum Master planeia features
→ Estima story points
```

### 4. Iniciar Sprint
```
POST /api/projects/:id/sprints/:sid/start
→ Status: PLANNING → ACTIVE
```

### 5. Desenvolver Features
```
POST /api/projects/:id/features
→ Auto-estimativa story points

POST /api/projects/:id/features/:fid/start-build
→ Feature Pipeline executa em background
→ Auto-fix bugs até QA score 95
```

### 6. Terminar Sprint
```
POST /api/projects/:id/sprints/:sid/end
→ Calcula velocity
→ Status: ACTIVE → DONE
→ Sprint review com IA
```

## Próximos Passos (FASE 3)

1. **WebSocket Real-Time**
   - Notificações de progresso de features
   - Updates de QA score
   - Daily standup automático

2. **Dashboard Analytics**
   - Burndown charts
   - Velocity tracking
   - Sprint health metrics

3. **Git Integration**
   - Auto-commit features
   - Branch management
   - Pull requests

4. **Deploy Integration**
   - Auto-deploy features
   - Preview environments
   - Rollback automático

## Notas Técnicas

- Todas as routes usam TypeScript strict mode
- Error handling com `AppError` custom
- Logging estruturado
- Rate limiting aplicado (100 req/15min por IP)
- Helmet security headers
- CORS configurado
- Input sanitization (XSS protection)

## Testing

```bash
# Build
npm run build

# Start
npm run dev

# Test endpoints
curl http://localhost:5680/api/projects/:id/sprints
```
