# DevForge V2 — Express Server

Backend completo em TypeScript com Express, Prisma, Anthropic e Ollama.

## Estrutura

```
src/
├── index.ts                    # Server principal
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── anthropic.ts           # Anthropic client + retry logic
│   ├── ollama.ts              # Ollama client + health check
│   └── sse.ts                 # Server-Sent Events manager
├── middleware/
│   ├── auth.ts                # requireAuth + extractUser
│   └── error.ts               # Error handler + AppError class
├── routes/
│   ├── auth.ts                # Register, Login, Logout, Me
│   ├── projects.ts            # CRUD + Chat + Build + Download
│   ├── settings.ts            # User settings
│   └── health.ts              # Health checks
└── services/
    └── (agents e validadores)
```

## Rotas

### Auth (`/api/auth`)
- `POST /register` - Criar conta
- `POST /login` - Login
- `POST /logout` - Logout
- `GET /me` - User info

### Projects (`/api/projects`)
- `POST /` - Criar projecto + iniciar intake
- `GET /` - Listar projectos do user
- `GET /:id` - Detalhes do projecto
- `POST /:id/chat` - Enviar mensagem para PM Agent
- `POST /:id/confirm` - Confirmar PRD e iniciar build
- `POST /:id/pause` - Pausar build
- `POST /:id/resume` - Retomar build
- `GET /:id/stream` - SSE logs em tempo real
- `GET /:id/download` - Download projecto em ZIP

### Settings (`/api/settings`)
- `GET /` - Obter settings do user
- `PUT /` - Actualizar settings

### Health (`/api/health`)
- `GET /` - Status geral
- `GET /ollama` - Status Ollama
- `GET /anthropic` - Status Anthropic
- `GET /db` - Status database

## Iniciar

```bash
# Instalar dependências
npm install

# Configurar .env
cp .env.example .env
# Editar .env com as tuas chaves

# Inicializar DB
npm run db:push

# Dev mode
npm run dev

# Build production
npm run build
npm start
```

## Variáveis de Ambiente

```bash
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="sk-ant-..."
OLLAMA_BASE_URL="http://localhost:11434"
PORT=5680
FRONTEND_URL="http://localhost:5679"
```

## Auth

Actualmente usa header `X-User-ID` para autenticação simples.

TODO: Integrar Better-Auth completo com password hashing e sessões.

## SSE (Server-Sent Events)

Os projectos emitem eventos em tempo real via `/api/projects/:id/stream`:

```javascript
const eventSource = new EventSource('/api/projects/123/stream');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

Eventos enviados:
- `{ type: 'connected', projectId }`
- `{ type: 'status', status }`
- `{ type: 'log', level, message }`
- `{ type: 'phase', phase, status }`

## Error Handling

Todos os erros são capturados pelo middleware `errorHandler`.

Para erros personalizados:

```typescript
import { AppError } from './middleware/error.js';

throw new AppError('Custom error message', 400);
```

## Prisma

Cliente singleton configurado em `/lib/prisma.ts`.

Comandos úteis:

```bash
npm run db:push      # Sync schema
npm run db:studio    # Prisma Studio GUI
```

## Health Checks

O servidor verifica automaticamente no arranque:
- Database connection
- Anthropic API key
- Ollama availability

Status visível em `/api/health`.
