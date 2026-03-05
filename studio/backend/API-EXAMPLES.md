# DevForge V2 — API Examples

## Auth

### Register
```bash
curl -X POST http://localhost:5680/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "secure123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5680/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure123"
  }'
```

### Get Current User
```bash
curl http://localhost:5680/api/auth/me \
  -H "X-User-ID: clxxx123"
```

## Projects

### Create Project
```bash
curl -X POST http://localhost:5680/api/projects \
  -H "Content-Type: application/json" \
  -H "X-User-ID: clxxx123" \
  -d '{
    "name": "My SaaS Platform",
    "description": "Build me a SaaS platform with user auth, payment integration, and dashboard"
  }'
```

Response:
```json
{
  "id": "clyyy456",
  "name": "My SaaS Platform",
  "description": "Build me a SaaS platform...",
  "status": "INTAKE",
  "createdAt": "2026-03-05T12:00:00.000Z",
  "phases": [],
  "messages": []
}
```

### List Projects
```bash
curl http://localhost:5680/api/projects \
  -H "X-User-ID: clxxx123"
```

### Get Project Details
```bash
curl http://localhost:5680/api/projects/clyyy456 \
  -H "X-User-ID: clxxx123"
```

### Chat with PM Agent
```bash
curl -X POST http://localhost:5680/api/projects/clyyy456/chat \
  -H "Content-Type: application/json" \
  -H "X-User-ID: clxxx123" \
  -d '{
    "content": "I also want Stripe integration for payments"
  }'
```

### Confirm PRD and Start Build
```bash
curl -X POST http://localhost:5680/api/projects/clyyy456/confirm \
  -H "X-User-ID: clxxx123"
```

### Pause Build
```bash
curl -X POST http://localhost:5680/api/projects/clyyy456/pause \
  -H "X-User-ID: clxxx123"
```

### Resume Build
```bash
curl -X POST http://localhost:5680/api/projects/clyyy456/resume \
  -H "X-User-ID: clxxx123"
```

### Stream Real-Time Logs (SSE)
```bash
curl -N http://localhost:5680/api/projects/clyyy456/stream \
  -H "X-User-ID: clxxx123"
```

Browser:
```javascript
const eventSource = new EventSource(
  'http://localhost:5680/api/projects/clyyy456/stream',
  {
    headers: { 'X-User-ID': 'clxxx123' }
  }
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

### Download Project ZIP
```bash
curl http://localhost:5680/api/projects/clyyy456/download \
  -H "X-User-ID: clxxx123" \
  -o my-project.zip
```

## Settings

### Get Settings
```bash
curl http://localhost:5680/api/settings \
  -H "X-User-ID: clxxx123"
```

Response:
```json
{
  "id": "clzzz789",
  "userId": "clxxx123",
  "anthropicKey": "***-ant-1234",
  "ollamaUrl": "http://localhost:11434",
  "ollamaModelDev": "qwen2.5-coder:32b",
  "ollamaModelFix": "qwen2.5-coder:14b",
  "outputDirectory": "./generated-projects",
  "notifyEmail": true,
  "notifyDesktop": true,
  "deployTarget": "vercel+railway"
}
```

### Update Settings
```bash
curl -X PUT http://localhost:5680/api/settings \
  -H "Content-Type: application/json" \
  -H "X-User-ID: clxxx123" \
  -d '{
    "anthropicKey": "sk-ant-api03-new-key",
    "ollamaUrl": "http://192.168.1.100:11434",
    "notifyEmail": false
  }'
```

## Health Checks

### Overall Health
```bash
curl http://localhost:5680/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-05T12:00:00.000Z",
  "services": {
    "database": "up",
    "anthropic": "up",
    "ollama": "up"
  }
}
```

### Ollama Health
```bash
curl http://localhost:5680/api/health/ollama
```

### Anthropic Health
```bash
curl http://localhost:5680/api/health/anthropic
```

### Database Health
```bash
curl http://localhost:5680/api/health/db
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Name and description are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized: No user ID provided"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "stack": "Error: ...\n    at ..." // Only in development
}
```

## SSE Event Types

### Connected
```json
{
  "type": "connected",
  "projectId": "clyyy456"
}
```

### Status Change
```json
{
  "type": "status",
  "status": "BUILDING"
}
```

### Log Entry
```json
{
  "type": "log",
  "level": "INFO",
  "message": "Frontend build completed",
  "userMsg": "A interface está pronta!"
}
```

### Phase Update
```json
{
  "type": "phase",
  "phase": "FRONTEND",
  "status": "DONE"
}
```

## Project Statuses

- `INTAKE` - A recolher requisitos com PM Agent
- `PLANNING` - A gerar PRD e arquitectura
- `BUILDING` - A desenvolver código
- `QA` - A executar testes automáticos
- `FIXING` - A corrigir bugs detectados
- `DEPLOYING` - A fazer deploy
- `DELIVERED` - Completo e entregue
- `FAILED` - Falhou (erro irrecuperável)
- `PAUSED` - Pausado pelo utilizador
