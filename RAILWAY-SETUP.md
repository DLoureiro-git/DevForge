# 🚂 RAILWAY DEPLOY — PRÓXIMOS PASSOS

## ✅ STATUS ACTUAL

**Backend Deploy:** ✅ **SUCESSO** - Build completo, servidor a correr
- **URL:** https://railway.com/project/e01b1644-1bae-4d2e-978d-be1138cbec64
- **Workspace:** hugotorres10's Projects ✓
- **Service:** devforge-backend
- **Port:** 8080 (auto-assigned)

### Build Logs
```
✓ TypeScript build: SUCCESS
✓ Dependencies installed
✓ Server started
⚠️  Waiting for environment variables
```

---

## ⚙️ CONFIGURAÇÃO NECESSÁRIA

### 1. Adicionar PostgreSQL Database

**Via Railway Dashboard:**
1. Abrir https://railway.com/project/e01b1644-1bae-4d2e-978d-be1138cbec64
2. Click em "+ New"
3. Selecionar "Database" → "PostgreSQL"
4. Aguardar provisioning (~1 min)
5. A variável `DATABASE_URL` será criada automaticamente

**Via CLI (alternativa):**
```bash
cd ~/devforge-v2/studio/backend
railway add --database postgres
```

---

### 2. Configurar Variáveis de Ambiente

**Obrigatórias:**

```bash
# Anthropic API Key (PM Agent + Delivery Agent)
railway variables set ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE

# Database URL (auto-criado após adicionar PostgreSQL)
# Ex: DATABASE_URL=postgresql://postgres:password@host:5432/railway
```

**Opcionais (sistema funciona sem estas):**

```bash
# Ollama (se usar remoto, senão deixar vazio)
railway variables set OLLAMA_BASE_URL=http://your-ollama-server:11434
railway variables set OLLAMA_MODEL_DEV=qwen2.5-coder:32b
railway variables set OLLAMA_MODEL_FIX=qwen2.5-coder:14b

# Deploy services (para auto-deploy de projectos gerados)
railway variables set VERCEL_TOKEN=your_vercel_token
railway variables set RAILWAY_TOKEN=your_railway_token
railway variables set GITHUB_TOKEN=your_github_token

# Email notifications (Resend)
railway variables set RESEND_API_KEY=your_resend_key

# Payments (Stripe)
railway variables set STRIPE_SECRET_KEY=sk_live_...
railway variables set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

### 3. Migration Database

Após PostgreSQL estar configurado:

```bash
cd ~/devforge-v2/studio/backend
railway run npx prisma db push
```

Isto cria todas as tabelas no PostgreSQL.

---

### 4. Deploy Frontend

**Criar serviço frontend:**

```bash
cd ~/devforge-v2/studio/frontend
railway init
railway up
```

**Configurar variáveis frontend:**
```bash
railway variables set VITE_API_URL=https://devforge-backend.up.railway.app
```

---

### 5. Testar Health Check

Após configurar ANTHROPIC_API_KEY:

```bash
curl https://devforge-backend.up.railway.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-05T...",
  "services": {
    "database": "connected",
    "anthropic": "available",
    "ollama": "unavailable"  // OK se não configurado
  }
}
```

---

## 📋 CHECKLIST DEPLOY

### Backend
- [x] Build TypeScript success
- [x] Dependencies instaladas
- [x] Server iniciado (port 8080)
- [x] GitHub repo conectado
- [ ] PostgreSQL adicionado
- [ ] DATABASE_URL configurado
- [ ] ANTHROPIC_API_KEY configurado
- [ ] Prisma migration executada
- [ ] Health check OK

### Frontend
- [ ] Service criado no Railway
- [ ] Build configurado (Vite)
- [ ] VITE_API_URL configurado
- [ ] Deploy completo
- [ ] URL pública funcional

### Testing
- [ ] Health check endpoint responde
- [ ] PM Agent intake funcional
- [ ] Criar primeiro projecto teste (end-to-end)
- [ ] Download ZIP funciona
- [ ] Deploy automático funciona (se Vercel/Railway tokens configurados)

---

## 🔗 LINKS ÚTEIS

- **Railway Project:** https://railway.com/project/e01b1644-1bae-4d2e-978d-be1138cbec64
- **GitHub Repo:** https://github.com/DLoureiro-git/DevForge
- **Docs Locais:** ~/devforge-v2/README.md
- **Quick Start:** ~/devforge-v2/QUICK-START.md

---

## 🚀 APÓS TUDO CONFIGURADO

### Teste Local → Produção

1. **Local:** http://localhost:3000
2. **Produção:** https://devforge-frontend.up.railway.app

### Criar Primeiro Projecto

1. Abrir frontend
2. Criar conta
3. Novo Projeto
4. Chat: "Quero uma landing page para fotógrafo"
5. Responder ~5 perguntas do PM Agent
6. Confirmar PRD
7. Aguardar ~8 minutos
8. ✅ Download ZIP ou URL deployada

---

## 💡 NOTAS

- **Ollama Local:** Sistema funciona sem Ollama remoto, mas precisa de Ollama local rodando durante development
- **Custos:** ~$0.20-$0.60 por projecto (só Claude Opus nos endpoints PM/Delivery)
- **Build Time:** ~5-15min por projecto
- **Score QA:** Sistema aceita ≥85% para produção

---

**Status:** 🎯 **Backend Deployed, Aguardando Configuração**
**Próximo:** Adicionar PostgreSQL + ANTHROPIC_API_KEY + Frontend Deploy
