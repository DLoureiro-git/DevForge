# DevForge V2 — FASE 8: Checklist Manual

## Instruções

Este checklist deve ser executado manualmente por um QA ou developer.

**Como usar:**
1. Iniciar backend: `cd studio/backend && npm run dev`
2. Iniciar frontend: `cd studio/frontend && npm run dev`
3. Abrir browser: `http://localhost:5679`
4. Seguir os testes abaixo e marcar ✅ ou ❌

---

## 1. Autenticação

### Login
- [ ] Formulário de login aparece
- [ ] Validação de email funciona (ex: email inválido mostra erro)
- [ ] Validação de password funciona (mínimo 6 chars)
- [ ] Login com credenciais correctas funciona
- [ ] Redirect para dashboard após login
- [ ] Mensagem de erro clara quando credenciais erradas

### Signup
- [ ] Formulário de signup aparece
- [ ] Email único validado (não permite duplicados)
- [ ] Password forte validada (mínimo 8 chars, maiúscula, número)
- [ ] Confirmação de password funciona
- [ ] Criar conta funciona
- [ ] Redirect para dashboard após signup

### Logout
- [ ] Botão logout visível
- [ ] Logout limpa sessão
- [ ] Redirect para login após logout

---

## 2. Dashboard

### Layout
- [ ] Sidebar visível com navegação
- [ ] Header com nome do utilizador
- [ ] Cards de projetos aparecem
- [ ] Botão "Novo Projeto" visível
- [ ] Estatísticas (total projetos, activos, completos) correctas

### Projetos
- [ ] Lista de projetos carrega correctamente
- [ ] Cada projeto mostra: nome, status, data de criação
- [ ] Status badges têm cores correctas (INTAKE=azul, BUILDING=laranja, DELIVERED=verde)
- [ ] Clicar num projeto abre detalhes

---

## 3. Criar Projeto

### Modal/Form
- [ ] Clicar "Novo Projeto" abre modal/página
- [ ] Campo "Nome" obrigatório
- [ ] Campo "Descrição" obrigatório
- [ ] Botão "Criar" funciona
- [ ] Loading state aparece durante criação
- [ ] Toast de sucesso aparece após criação
- [ ] Redirect para página do projeto

### Validação
- [ ] Não permite criar projeto sem nome
- [ ] Não permite criar projeto sem descrição
- [ ] Descrição mínima de 20 caracteres (validar)

---

## 4. PM Agent Chat (Intake)

### UI
- [ ] Chat interface visível
- [ ] Mensagens anteriores carregam
- [ ] Campo de input funciona
- [ ] Botão enviar funciona
- [ ] Enter key envia mensagem
- [ ] Loading indicator durante resposta do PM

### Funcionalidade
- [ ] Mensagem do utilizador aparece imediatamente
- [ ] Resposta do PM Agent aparece após 2-5s
- [ ] Quick replies aparecem (se aplicável)
- [ ] Histórico de mensagens persiste após reload
- [ ] Scroll automático para última mensagem

### PRD Generation
- [ ] PM Agent faz perguntas obrigatórias
- [ ] Após intake completo, PRD é gerado
- [ ] PRD mostra: páginas, modelos, features
- [ ] Botão "Confirmar PRD" aparece
- [ ] Estimativa de tempo aparece (ex: "~14 minutos")

---

## 5. Pipeline Build

### Visualização
- [ ] Pipeline visual aparece após confirmar PRD
- [ ] Nós do pipeline: PM → Architect → Dev → QA → Deploy
- [ ] Status de cada nó visível (PENDING, RUNNING, DONE, ERROR)
- [ ] Animação de "pulsing" no nó activo
- [ ] Checkmark verde em nós completos

### Real-time Updates
- [ ] Pipeline actualiza automaticamente (SSE ou polling)
- [ ] Logs aparecem em tempo real
- [ ] Progresso % actualiza
- [ ] Tempo decorrido actualiza
- [ ] ETA actualiza

### Logs
- [ ] Logs técnicos visíveis
- [ ] Logs filtráveis (INFO, ERROR, SUCCESS)
- [ ] Logs scrollable
- [ ] Timestamp em cada log
- [ ] Copy to clipboard funciona

---

## 6. Settings

### UI
- [ ] Página de settings carrega
- [ ] Formulário de settings visível
- [ ] Valores actuais pré-preenchidos

### Campos
- [ ] Anthropic API Key (input password)
- [ ] Ollama URL (default: http://localhost:11434)
- [ ] Ollama Model Dev (default: qwen2.5-coder:32b)
- [ ] Ollama Model Fix (default: qwen2.5-coder:14b)
- [ ] Output Directory (default: ./generated-projects)
- [ ] Botão "Save" funciona

### Validação
- [ ] API Key obrigatória (validação)
- [ ] URL Ollama válida (formato URL)
- [ ] Toast de sucesso após save
- [ ] Valores persistem após reload

---

## 7. Ollama Status Check

### UI
- [ ] Badge "Ollama Status" visível (Settings ou Dashboard)
- [ ] Status green = conectado
- [ ] Status red = desconectado

### Funcionalidade
- [ ] Com Ollama ON: badge verde + "Connected"
- [ ] Com Ollama OFF: badge vermelho + "Disconnected"
- [ ] Lista de modelos disponíveis (se conectado)
- [ ] Botão "Refresh" actualiza status
- [ ] Aviso se modelo configurado não existe

---

## 8. Multi-tenant Isolation

### Teste A
1. Login como User A (criar conta se necessário)
2. Criar projeto "Project A"
3. Logout

### Teste B
1. Login como User B (outra conta)
2. Criar projeto "Project B"
3. Dashboard: NÃO deve mostrar "Project A"
4. Tentar aceder URL de "Project A" directamente → deve retornar 404

### Resultado Esperado
- [ ] User A só vê projetos de User A
- [ ] User B só vê projetos de User B
- [ ] 404 ao aceder projeto de outro user

---

## 9. Sprints & Features (se implementado)

### Sprints
- [ ] Criar sprint no projeto
- [ ] Sprint mostra: número, goal, datas
- [ ] Editar sprint funciona
- [ ] Deletar sprint funciona (com confirmação)

### Features
- [ ] Criar feature no sprint
- [ ] Feature mostra: título, descrição, status, prioridade
- [ ] Editar feature funciona
- [ ] Drag & drop feature entre colunas (Kanban)
- [ ] Status actualiza após drag
- [ ] Feature persiste após reload

---

## 10. Bug Tracker (durante QA)

### UI
- [ ] Lista de bugs aparece quando status = QA
- [ ] Cada bug mostra: severity, categoria, descrição
- [ ] Badges de severity têm cores (CRITICAL=red, HIGH=orange)

### Funcionalidade
- [ ] Bugs detectados pelo QA Agent aparecem
- [ ] Clicar num bug mostra detalhes (ficheiro, linha)
- [ ] Marcar bug como "fixed" funciona
- [ ] Lista actualiza em tempo real

---

## 11. Download & Deploy

### Download
- [ ] Botão "Download" visível quando projeto DELIVERED
- [ ] Clicar download inicia download de .zip
- [ ] Ficheiro .zip contém código gerado
- [ ] Código descomprimido funciona localmente

### Deploy
- [ ] URL de deploy aparece (se aplicável)
- [ ] Clicar URL abre app deployada
- [ ] App funciona correctamente

---

## 12. Responsividade

### Mobile (375px)
- [ ] Layout adapta para mobile
- [ ] Sidebar colapsa em hamburger menu
- [ ] Botões têm tamanho touch-friendly (min 44px)
- [ ] Forms funcionam em mobile
- [ ] Pipeline visível (scroll horizontal se necessário)

### Tablet (768px)
- [ ] Layout adapta para tablet
- [ ] Sidebar visível ou colapsável
- [ ] Cards ajustam em grid

### Desktop (1440px+)
- [ ] Layout usa espaço disponível
- [ ] Não há overflow horizontal desnecessário

---

## 13. Acessibilidade

### Keyboard Navigation
- [ ] Tab navega por todos os elementos interactivos
- [ ] Enter activa botões
- [ ] Escape fecha modals
- [ ] Focus visível (outline azul)

### Screen Reader
- [ ] Labels em todos os inputs
- [ ] Alt text em imagens
- [ ] ARIA labels em botões icon-only
- [ ] Anúncios de status changes (ex: "Project created")

### Contraste
- [ ] Texto tem contraste mínimo 4.5:1
- [ ] Botões têm contraste suficiente
- [ ] Links visíveis

---

## 14. Performance

### Carregamento
- [ ] Dashboard carrega < 2s
- [ ] Projetos carregam < 1s
- [ ] Chat responde < 5s (depende de API)
- [ ] Pipeline updates < 500ms

### Optimizações
- [ ] Lazy loading de imagens (se aplicável)
- [ ] Debounce em search inputs
- [ ] Infinite scroll ou paginação em listas grandes

---

## 15. Edge Cases

### Network Errors
- [ ] Sem internet: mensagem clara "Sem conexão"
- [ ] API timeout: mensagem "Request timeout"
- [ ] 500 error: mensagem "Algo correu mal"
- [ ] Retry automático ou botão "Tentar novamente"

### Empty States
- [ ] Dashboard sem projetos: mensagem "Cria o teu primeiro projeto"
- [ ] Chat sem mensagens: mensagem "Envia uma mensagem"
- [ ] Logs vazios: mensagem "Sem logs ainda"

### Limites
- [ ] Plano FREE: máximo X projetos
- [ ] Plano FREE: mensagem clara ao atingir limite
- [ ] Upgrade prompt visível

---

## 16. Browser Compatibility

### Chrome
- [ ] Layout OK
- [ ] Funcionalidades OK
- [ ] Performance OK

### Firefox
- [ ] Layout OK
- [ ] Funcionalidades OK
- [ ] Performance OK

### Safari
- [ ] Layout OK
- [ ] Funcionalidades OK
- [ ] Performance OK

### Edge
- [ ] Layout OK
- [ ] Funcionalidades OK
- [ ] Performance OK

---

## Resultado Final

**Total de testes:** 150+

**Testes passados:** _____ / _____

**Testes falhados:** _____ / _____

**Bugs críticos encontrados:** _____

**Bugs não-críticos encontrados:** _____

---

## Bugs Encontrados

### Bug #1
- **Descrição:**
- **Severidade:** CRITICAL | HIGH | MEDIUM | LOW
- **Steps to reproduce:**
- **Expected:**
- **Actual:**
- **Status:** OPEN | FIXED

### Bug #2
...

---

## Notas Adicionais

(Adicionar observações, sugestões, melhorias)

---

**Testado por:** _________________

**Data:** _________________

**Aprovado:** SIM [ ] NÃO [ ]
