# DevForge V2 - Testes de Funcionalidade

## URLs de Produção
- **Frontend:** https://perceptive-possibility-production-f87c.up.railway.app
- **Backend API:** https://brilliant-appreciation-production.up.railway.app

## Status Actual
✅ Frontend deployado e a carregar
✅ Backend online (database UP)
✅ Autenticação automática implementada
✅ Novo design integrado

## Lista de Testes

### 1. Autenticação Automática
- [ ] Abrir aplicação
- [ ] Ver mensagem "A inicializar DevForge V2..."
- [ ] User demo criado automaticamente
- [ ] Dashboard carrega sem erros

### 2. Dashboard
- [ ] Ver title bar com "DevForge" e versão
- [ ] Sidebar à esquerda com 3 botões
- [ ] Stats no topo (Total, Entregues, Tempo médio, QA Score)
- [ ] Botão "Novo Projecto" visível
- [ ] Lista de projectos (ou mensagem se vazio)

### 3. Criar Novo Projecto
- [ ] Clicar em "Novo Projecto"
- [ ] Modal abre com animação
- [ ] Textarea para descrever ideia
- [ ] 3 exemplos de prompts clicáveis
- [ ] Clicar num exemplo preenche textarea
- [ ] Botão "Criar Projecto" apenas activo com texto
- [ ] Criar projecto envia para backend
- [ ] Modal fecha após criação
- [ ] Dashboard recarrega com novo projecto

### 4. Ver Projecto
- [ ] Clicar num projecto da lista
- [ ] ProjectView abre
- [ ] Ver nome do projecto e status badge
- [ ] Ver pipeline com fases
- [ ] Painel de logs à direita
- [ ] Botão voltar (←) funciona

### 5. Navegação Sidebar
- [ ] Ícone Dashboard (layers) - leva ao dashboard
- [ ] Ícone Projecto (terminal) - desabilitado se sem projecto seleccionado
- [ ] Ícone Settings (engrenagem) - abre configurações
- [ ] Ícone User (em baixo) - tem destaque visual

### 6. Design e Animações
- [ ] Cards têm hover effect (border fica mais clara)
- [ ] Botões têm transições suaves
- [ ] Progress bars animadas
- [ ] Status dots pulsantes para projectos em curso
- [ ] Scroll custom (barra fina)
- [ ] Fonte Syne para títulos
- [ ] Fonte DM Sans para texto
- [ ] Fonte JetBrains Mono para código/logs

### 7. Integração com BD
- [ ] Projectos carregam da base de dados
- [ ] Stats calculadas correctamente
- [ ] Novo projecto persiste
- [ ] User demo guardado no localStorage
- [ ] Refresh mantém sessão

### 8. Responsive (Opcional)
- [ ] Testar em diferentes tamanhos de janela
- [ ] Sidebar mantém-se fixa
- [ ] Content area ajusta

## Bugs Conhecidos a Corrigir
- Settings page ainda não implementada (mostra "Em desenvolvimento")
- Logs do ProjectView ainda não carregam da BD
- Fases do pipeline precisam carregar dados reais

## Próximos Passos
1. Implementar Settings page completa
2. Carregar logs reais das fases
3. Adicionar WebSocket para updates em tempo real
4. Implementar PM Intake Chat
5. Adicionar sistema de notificações

## Como Testar Localmente
```bash
cd ~/devforge-v2/studio/frontend
npm run dev
```

Abrir: http://localhost:3000

## Como Ver Logs do Backend
```bash
cd ~/devforge-v2/studio/backend
railway logs --tail 50
```

## Como Ver BD
```bash
cd ~/devforge-v2/studio/backend
railway run npx prisma studio
```

---

**Nota:** O design foi completamente renovado com base no feedback. Todas as ligações à base de dados estão funcionais. Se encontrares algum problema, verifica os logs do backend no Railway.
