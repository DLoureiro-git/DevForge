# DevForge V2 - Frontend

Interface React moderna para a plataforma DevForge V2.

## Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **Lucide React** - Icons
- **Canvas Confetti** - Animations

## Design System

### Cores

- **Base**: `#070710` (background principal)
- **Phases**:
  - Intake: Azul (`#3b82f6`)
  - Plan: Índigo (`#6366f1`)
  - Build: Roxo (`#8b5cf6`)
  - QA: Cyan (`#06b6d4`)
  - Fix: Amber (`#f59e0b`)
  - Deploy: Verde (`#10b981`)

### Fonts

- **Display**: Syne (títulos)
- **Body**: DM Sans (texto)
- **Mono**: JetBrains Mono (código)

## Estrutura

```
src/
├── components/
│   ├── PipelineVisual.tsx    # Visualização das 6 fases
│   ├── ProgressNarrative.tsx # Narrativa de progresso
│   ├── DeliveryCard.tsx      # Card de conclusão
│   ├── Logs.tsx              # Terminal de logs
│   ├── IntakeChat.tsx        # Chat do PM Agent
│   └── ErrorBoundary.tsx     # Error handling
├── pages/
│   ├── Dashboard.tsx         # Lista de projetos
│   ├── ProjectView.tsx       # Visualização do projeto
│   └── Settings.tsx          # Configurações
├── lib/
│   ├── api.ts               # Cliente API
│   └── store.ts             # Zustand store
├── hooks/
│   └── useSSE.ts            # Hook para Server-Sent Events
└── App.tsx                  # Router principal
```

## Setup

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## API Backend

O frontend comunica com o backend FastAPI em `http://localhost:8000` através de proxy configurado no Vite.

### Endpoints principais:

- `GET /api/projects` - Lista projetos
- `POST /api/projects` - Cria projeto
- `GET /api/projects/:id` - Detalhes do projeto
- `POST /api/projects/:id/chat` - Enviar mensagem
- `GET /api/projects/:id/pipeline` - Status do pipeline
- `GET /api/projects/:id/logs/stream` - Stream de logs (SSE)

## Componentes Principais

### PipelineVisual

Visualização das 6 fases do desenvolvimento:
1. Intake (PM Agent)
2. Planeamento (Architect Agent)
3. Desenvolvimento (Dev Agent)
4. QA (QA Agent)
5. Correções (Fix Agent)
6. Deploy (Deploy Agent)

Estados: `pending`, `running`, `done`, `error`

### ProgressNarrative

Mostra uma frase de progresso de cada vez com animação suave:
- "✨ A criar design das páginas..."
- Progress bar 0-100%
- Transições suaves entre mensagens

### DeliveryCard

Card de conclusão com confetti animation:
- Resumo do projeto
- Métricas (tempo, features, QA score)
- Botões de ação (abrir, código, download)

### Logs

Terminal de logs em tempo real:
- SSE stream do backend
- Filtros por nível (ERROR, WARN, INFO, DEBUG)
- Auto-scroll
- Terminal-style com timestamps

## Features

- Dark theme nativo
- Responsive design (mobile-first)
- Real-time updates via SSE
- Error boundary para handling de erros
- TypeScript strict mode
- Animações suaves
- Glow effects nas fases activas
- Noise texture background

## Ambiente

Frontend roda em `http://localhost:3000`
Backend esperado em `http://localhost:8000`
