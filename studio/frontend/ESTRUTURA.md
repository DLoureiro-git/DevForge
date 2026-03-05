# DevForge V2 - Estrutura Frontend

## Ficheiros Criados

### Configuração Base
- `package.json` - Dependências (React 18, Vite, TypeScript, Tailwind)
- `vite.config.ts` - Config Vite com proxy para backend
- `tsconfig.json` - TypeScript strict mode
- `tailwind.config.js` - Design system V2
- `postcss.config.js` - PostCSS config
- `.eslintrc.cjs` - ESLint config
- `.gitignore` - Git ignore
- `index.html` - HTML base com Google Fonts
- `dev.sh` - Script de desenvolvimento

### Código Fonte

#### CSS Global
- `src/index.css` - Design system, utility classes, noise texture

#### Main
- `src/main.tsx` - Entry point React
- `src/App.tsx` - Router principal

#### Pages
- `src/pages/Dashboard.tsx` - Lista de projetos + métricas
- `src/pages/ProjectView.tsx` - View do projeto (3 colunas)
- `src/pages/Settings.tsx` - Configurações de API keys

#### Componentes Core
- `src/components/PipelineVisual.tsx` - 6 fases do pipeline
- `src/components/ProgressNarrative.tsx` - Narrativa de progresso
- `src/components/DeliveryCard.tsx` - Card de conclusão com confetti
- `src/components/Logs.tsx` - Terminal de logs SSE
- `src/components/IntakeChat.tsx` - Chat do PM Agent (atualizado)
- `src/components/ErrorBoundary.tsx` - Error handling

#### Lib
- `src/lib/api.ts` - Cliente API REST
- `src/lib/store.ts` - Zustand store global

#### Hooks
- `src/hooks/useSSE.ts` - Hook para Server-Sent Events

#### Types
- `src/types/index.ts` - TypeScript interfaces globais

## Design System V2

### Cores
```css
--bg-base: #070710
--bg-light: #0f0f1a
--bg-lighter: #1a1a2e

--phase-intake: #3b82f6 (azul)
--phase-plan: #6366f1 (índigo)
--phase-build: #8b5cf6 (roxo)
--phase-qa: #06b6d4 (cyan)
--phase-fix: #f59e0b (amber)
--phase-deploy: #10b981 (verde)
```

### Tipografia
- **Display**: Syne (títulos)
- **Body**: DM Sans (texto)
- **Mono**: JetBrains Mono (código)

### Componentes Utility
- `.glass-card` - Card com glassmorphism
- `.btn-*` - Botões (primary, secondary, ghost, success)
- `.input` - Input com focus ring
- `.badge-*` - Badges de status
- `.terminal` - Estilo terminal
- `.custom-scrollbar` - Scrollbar customizada

## Features

### Dashboard
- Grid de projetos com cards
- Métricas (total, sucessos, tempo médio)
- Modal de criar projeto
- Delete de projetos

### ProjectView
- Layout 3 colunas responsivo
- Pipeline visual (horizontal desktop, vertical mobile)
- Chat intake lado esquerdo
- Progress narrative centro
- Logs lado direito
- DeliveryCard quando completo

### PipelineVisual
- 6 nós com cores por fase
- Estados: pending, running, done, error
- Glow effect em nó activo
- Drawer com detalhes técnicos
- Responsivo

### ProgressNarrative
- UMA frase de cada vez
- Progress bar 0-100%
- Animação fade entre mensagens

### DeliveryCard
- Confetti animation (canvas-confetti)
- Stats (tempo, features, QA score)
- Botões: abrir, código, download

### Logs
- SSE stream real-time
- Filtros por nível
- Auto-scroll com toggle
- Terminal-style

## API Integration

### Endpoints
- `GET /api/projects` - Lista projetos
- `POST /api/projects` - Cria projeto
- `GET /api/projects/:id` - Detalhes projeto
- `POST /api/projects/:id/chat` - Chat intake
- `GET /api/projects/:id/pipeline` - Pipeline status
- `GET /api/projects/:id/logs/stream` - Logs SSE
- `GET /api/metrics` - Métricas dashboard
- `GET /api/settings` - Configurações
- `PUT /api/settings` - Update configurações
- `POST /api/settings/test` - Testar conexão

## Como Usar

### Desenvolvimento
```bash
cd ~/devforge-v2/studio/frontend
npm install
npm run dev
# ou
./dev.sh
```

### Build
```bash
npm run build
npm run preview
```

### Linting
```bash
npm run lint
```

## Próximos Passos

1. **Backend Integration** - Conectar com FastAPI backend
2. **Real-time Updates** - Implementar SSE para logs e progress
3. **Auth** - Sistema de autenticação
4. **Testes** - Unit tests com Vitest
5. **E2E** - E2E tests com Playwright
6. **Deploy** - Setup Vercel/Railway

## Notas Técnicas

- TypeScript strict mode ativado
- Proxy Vite para `/api` → `http://localhost:8000`
- SSE reconnect automático
- Error boundary global
- Responsive design mobile-first
- Dark theme nativo
- Animações suaves (CSS transitions)
- Glassmorphism effects
- Noise texture background
