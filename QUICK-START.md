# DEVFORGE V2 — QUICK START

## Setup em 5 Minutos

### 1. Clone & Install

```bash
git clone https://github.com/DLoureiro-git/DevForge.git devforge
cd devforge
```

### 2. Backend

```bash
cd studio/backend
npm install
cp .env.example .env

# Editar .env
nano .env
# Adicionar: ANTHROPIC_API_KEY=sk-ant-...

# Database
npx prisma db push

# Start
npm run dev
# ✅ Backend rodando em http://localhost:5680
```

### 3. Frontend

```bash
cd studio/frontend
npm install
npm run dev
# ✅ Frontend rodando em http://localhost:3000
```

### 4. Ollama

```bash
# Terminal separado
ollama serve
ollama pull qwen2.5-coder:32b
# ✅ Ollama pronto
```

### 5. Primeiro Projecto

1. Abrir http://localhost:3000
2. Criar conta
3. Novo Projeto
4. Chat: "Quero uma landing page para fotógrafo"
5. Responder ~5 perguntas
6. Confirmar PRD
7. Aguardar ~8 minutos
8. ✅ Projecto pronto!

## Troubleshooting

### Ollama não conecta
```bash
curl http://localhost:11434/api/tags
```

### Backend não inicia
```bash
cd studio/backend
npx prisma db push
npm run dev
```

### Frontend não carrega
```bash
cd studio/frontend
npm install
npm run dev
```

## Links Úteis

- **Docs:** ~/devforge/README.md
- **GitHub:** https://github.com/DLoureiro-git/DevForge
- **Backend Health:** http://localhost:5680/api/health
