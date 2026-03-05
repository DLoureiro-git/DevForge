# DEVFORGE V2 — No-Code Platform Chave na Mão

> Qualquer pessoa descreve uma ideia → Recebe produto web completo e deployado

---

## 🎯 VISÃO

**Antes:** Contratar dev ($5000) ou aprender a programar (6 meses)
**Depois:** Descrever ideia em 5 minutos → Receber produto a funcionar em 15 minutos

**Target:** Empreendedores, pequenos negócios, criadores — qualquer pessoa sem conhecimento técnico.

---

## 🏗️ ARQUITECTURA

### Dois Produtos

**1. DevForge Studio (esta plataforma)**
- Dashboard web onde crias projectos
- Chat com PM Agent inteligente
- Pipeline visual em tempo real
- Gestão de projectos

**2. Projectos Gerados**
- Cada um é app web independente
- Repo próprio no GitHub
- Deploy próprio (Vercel + Railway)
- Base de dados própria

---

## 🧠 O CORAÇÃO: PM AGENT

Consultor de produto que **nunca assume**.

### Árvore de Decisão

```
PERGUNTAS OBRIGATÓRIAS (4):
1. "Descreve-me o teu projecto"
2. "Quem vai usar?"
3. "Que problema resolve?"
4. "Tens referência?"

PERGUNTAS CONDICIONAIS (7):
- SE múltiplos users → "Precisam de conta?"
- SE conta → "Como entram? (Email/Google)"
- SE negócio → "Vais cobrar?"
- ...

PERGUNTAS DESIGN (3):
- "Cores ou identidade visual?"
- "Simples ou detalhado?"
- "Referência estética?"
```

### Linguagem 100% Não-Técnica

**NUNCA diz:** "Preferes PostgreSQL ou MongoDB?"
**SEMPRE diz:** "Os teus dados mudam muito ou são estáticos?"

---

## 📊 DATABASE SCHEMA

```prisma
User (email, plan)
  ↓
Project (name, status, prd, deployUrl)
  ↓
Message[] (conversa intake)
Phase[] (PM, Architect, Dev, QA, Deploy)
Bug[] (tracking QA)
Log[] (técnico + user-friendly)
```

**Enums:**
- `ProjectStatus`: INTAKE → PLANNING → BUILDING → QA → DELIVERED
- `PhaseType`: PM, ARCHITECT, FRONTEND, BACKEND, QA, DEPLOY
- `BugCategory`: RESPONSIVE, BUTTON, FORM, CONSOLE_ERROR, ...

---

## 🎨 DESIGN SYSTEM

### Fonts
```css
--font-display: 'Syne'           /* Títulos */
--font-body: 'DM Sans'           /* UI */
--font-mono: 'JetBrains Mono'    /* Code */
```

### Cores por Fase
```css
--phase-intake:   #38BDF8  /* azul sky */
--phase-plan:     #818CF8  /* índigo */
--phase-build:    #F472B6  /* rosa */
--phase-qa:       #FBBF24  /* âmbar */
--phase-fix:      #FB923C  /* laranja */
--phase-deploy:   #34D399  /* esmeralda */
```

### Componentes Críticos

**`<IntakeChat />`** — O mais importante
- Chat conversacional estilo WhatsApp
- Typing indicator ("DevForge AI está a pensar...")
- Quick reply buttons
- Auto-scroll
- Textarea expansível

**`<PipelineVisual />`**
- 6 nós: PM → Architect → Dev → QA → Fix → Deploy
- Estados: cinza (pending), azul pulsante (running), verde (done), vermelho (error)
- Glow animation no nó activo
- Drawer lateral com detalhes técnicos

**`<ProgressNarrative />`**
- UMA frase de cada vez
- "✨ A criar o design das páginas..."
- Progress bar geral 0-100%

**`<DeliveryCard />`**
- Confetti animation (canvas-confetti)
- "O teu projecto está pronto! 🎉"
- Botões: [Abrir] [Ver código] [Download ZIP]

---

## 🔧 STACK TÉCNICA

```
Frontend:     React 18 + Vite + TypeScript + Tailwind
State:        Zustand
UI:           shadcn/ui

Backend:      Node.js + Express + TypeScript
ORM:          Prisma
DB:           SQLite (dev) → PostgreSQL (prod)
Auth:         Better-Auth

AI:
  PM/Delivery:  Anthropic (claude-sonnet-4-20250514)
  Code:         Ollama (qwen2.5-coder:32b)

Email:        Resend
Payments:     Stripe
Storage:      Cloudflare R2
Deploy:       Vercel (frontend) + Railway (backend + DB)
Realtime:     Server-Sent Events (SSE)
```

---

## 📁 ESTRUTURA

```
~/devforge-v2/
├── studio/                          # DevForge Studio
│   ├── backend/
│   │   ├── src/
│   │   │   ├── index.ts            # Express server
│   │   │   ├── routes/             # API endpoints
│   │   │   │   ├── auth.ts
│   │   │   │   ├── projects.ts
│   │   │   │   └── settings.ts
│   │   │   ├── services/           # Agentes IA
│   │   │   │   ├── pm-agent.ts     # ⭐ Intake inteligente
│   │   │   │   ├── architect.ts
│   │   │   │   ├── dev-team.ts
│   │   │   │   ├── qa.ts
│   │   │   │   ├── bug-fix.ts
│   │   │   │   └── delivery.ts
│   │   │   ├── lib/
│   │   │   │   ├── prisma.ts
│   │   │   │   ├── anthropic.ts
│   │   │   │   └── ollama.ts
│   │   │   └── middleware/
│   │   │       ├── auth.ts
│   │   │       └── error.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # ⭐ Schema completo
│   │   │   └── seed.ts
│   │   └── package.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── IntakeChat.tsx  # ⭐ Componente chave
│       │   │   ├── PipelineVisual.tsx
│       │   │   ├── ProgressNarrative.tsx
│       │   │   ├── BugTracker.tsx
│       │   │   └── DeliveryCard.tsx
│       │   ├── pages/
│       │   │   ├── Dashboard.tsx
│       │   │   ├── ProjectView.tsx
│       │   │   └── Settings.tsx
│       │   ├── lib/
│       │   │   ├── api.ts
│       │   │   └── store.ts        # Zustand
│       │   └── App.tsx
│       └── package.json
│
└── generated-projects/              # Projectos gerados (gitignored)
    └── restaurant-bookings-xyz/
        ├── frontend/                # Next.js app
        ├── backend/                 # Express + Prisma
        ├── .env.example
        └── README.md
```

---

## 🚀 SETUP

### 1. Pré-requisitos

```bash
# Ollama instalado
brew install ollama
ollama serve  # Terminal 1

# Modelo Qwen
ollama pull qwen2.5-coder:32b  # ~18GB

# Node.js 22+
node --version
```

### 2. Instalação

```bash
cd ~/devforge-v2/studio/backend

# Install dependencies
npm install

# Setup database
cp .env.example .env
# Editar .env: adicionar ANTHROPIC_API_KEY

# Prisma
npx prisma db push
npx prisma db seed

# Start backend
npm run dev  # Port 5680
```

```bash
cd ~/devforge-v2/studio/frontend

# Install dependencies
npm install

# Start frontend
npm run dev  # Port 5679
```

### 3. Acesso

- **Studio:** http://localhost:5679
- **API:** http://localhost:5680

---

## 💡 EXEMPLO DE USO

### Input (chat)
```
User: "Quero uma app para gerir reservas do meu restaurante"

Agent: "Que ideia fantástica! 🍽️
        Quem vai usar isto? Tu sozinho, a tua equipa, ou os teus clientes?"

User: "Os clientes fazem reservas online, eu giro tudo num painel"

Agent: "Perfeito! Entendi.
        As pessoas precisam de ter conta própria ou podem reservar sem registo?"

User: "Sem conta, só precisam de pôr nome e email"

Agent: [... mais 5-7 perguntas ...]

Agent: "Óptimo! Aqui está o que vou construir para ti:
        📱 Plataforma de reservas para restaurante
        👥 Clientes reservam sem conta, tu geres com painel admin
        ✨ Calendário, formulário, confirmação por email
        🎨 Moderno e elegante, tons quentes
        ⏱️ Tempo estimado: 14 minutos

        Posso avançar?"

User: "Sim, começa"

Agent: "🚀 Perfeito! Estou a começar a construir..."
```

### Output (14 minutos depois)
- ✅ Produto deployado: `https://restaurant-bookings-xyz.vercel.app`
- ✅ Repo GitHub: `github.com/user/restaurant-bookings-xyz`
- ✅ Download ZIP disponível
- ✅ QA Score: 92/100

---

## ⏱️ ESTIMATIVAS

```typescript
function estimateTime(prd):
  base = 5min  // PM + Architect

  if hasAuth: +8min
  if hasPayments: +10min
  if hasFileUpload: +5min
  if hasRealtime: +8min
  if hasEmail: +3min
  if hasDashboard: +10min

  pages = prd.pages.length * 3min
  qa = 10min

  return base + features + pages + qa
```

---

## ✅ CHECKLIST DE QUALIDADE

### Responsividade (não negociável)
- [ ] Funciona em iPhone SE (375px)
- [ ] Funciona em iPad (768px)
- [ ] Funciona em desktop (1280px+)
- [ ] Zero scroll horizontal em qualquer viewport
- [ ] Pipeline: horizontal ≥1024px, vertical <1024px

### UI/UX
- [ ] Todos os botões têm cursor pointer + hover state
- [ ] Loading states visíveis (skeleton, não spinners)
- [ ] Feedback visual <100ms em toda a interacção
- [ ] Toast notifications (canto inferior direito)
- [ ] Confetti na entrega (canvas-confetti)

### Base de Dados
- [ ] Connection pooling
- [ ] Try/catch em toda a escrita
- [ ] Nunca expor erros DB ao user

### PM Agent
- [ ] Faz mínimo 3 perguntas obrigatórias
- [ ] Valida respostas antes de avançar
- [ ] Gera resumo antes de construir
- [ ] Estima tempo correctamente
- [ ] Zero jargão técnico nas mensagens

---

## 🎯 ROADMAP

### MVP (Semana 1-2)
- [x] Prisma schema completo
- [x] PM Agent com árvore de decisão
- [x] IntakeChat component
- [ ] Architect + 1 Dev agent (não 4)
- [ ] QA básico (build + TypeScript)
- [ ] Deploy manual

### V1 (Semana 3-4)
- [ ] Dev Team completo (4 agents paralelo)
- [ ] QA completo (Playwright)
- [ ] Bug Fix loop
- [ ] Deploy automático (Vercel + Railway)
- [ ] UI polida com animações

### V2 (Mês 2)
- [ ] Multi-user + auth
- [ ] Payments (Stripe)
- [ ] Email notifications (Resend)
- [ ] Project screenshots
- [ ] Analytics

---

## 📄 LICENÇA

MIT

---

**DevForge V2** — *O Shopify do Desenvolvimento de Software*
**By:** Diogo Loureiro (Prisma88)
**Date:** 2026-03-05
