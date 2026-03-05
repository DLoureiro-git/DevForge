# DevForge V2 — Security Quick Guide

Guia rápido para validar segurança do sistema.

---

## 1. Validação Automática (30 segundos)

```bash
cd /Users/diogoloureiro/devforge-v2
./validate-security.sh
```

**Resultado esperado:**
```
✅ Passou: 19
❌ Falhou: 0
🎉 TODAS AS VERIFICAÇÕES PASSARAM!
```

---

## 2. Executar Testes de Segurança (5 minutos)

```bash
cd studio/backend
npm run test:security
```

**Testes incluídos:**
- Cross-tenant access (User A ≠ User B)
- XSS injection attempts
- SQL injection attempts
- UUID validation
- Rate limiting enforcement
- Sensitive data masking
- Path traversal blocking
- Concurrent requests

---

## 3. Verificação Manual Rápida

### A. Rate Limiting

```bash
# Enviar 101 requests (limite é 100)
for i in {1..101}; do
  curl -s http://localhost:5680/api/projects \
    -H "x-user-id: test-user" &
done
wait

# Último request deve retornar 429 Too Many Requests
```

### B. Cross-Tenant Access

```bash
# User A cria projecto
PROJ_ID=$(curl -s -X POST http://localhost:5680/api/projects \
  -H "x-user-id: user-a" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test"}' | jq -r .id)

# User B tenta aceder (deve falhar)
curl -s http://localhost:5680/api/projects/$PROJ_ID \
  -H "x-user-id: user-b"
# Esperado: 404 Not Found
```

### C. XSS Prevention

```bash
curl -X POST http://localhost:5680/api/projects \
  -H "x-user-id: test-user" \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","description":"test"}' | jq .name
# Esperado: "&lt;script&gt;alert(1)&lt;/script&gt;"
```

### D. UUID Validation

```bash
# Tentar path traversal
curl http://localhost:5680/api/projects/../../../etc/passwd \
  -H "x-user-id: test-user"
# Esperado: 400 Bad Request
```

---

## 4. Checklist de Segurança Pré-Deploy

Antes de fazer deploy em produção, verificar:

### Backend
- [ ] `./validate-security.sh` passa (19/19)
- [ ] `npm run test:security` passa (todos os testes)
- [ ] Rate limiting configurado (100 req/15min)
- [ ] Helmet headers configurados
- [ ] API Keys mascaradas nos responses
- [ ] Todas as routes filtram por userId
- [ ] UUID validation em todos os endpoints

### Database
- [ ] Prisma schema tem índices composite
- [ ] Foreign keys com CASCADE delete
- [ ] Nenhuma query sem userId filter
- [ ] Backup automático configurado

### Environment
- [ ] `.env` tem todas as variáveis necessárias
- [ ] `DATABASE_URL` está correcto
- [ ] `FRONTEND_URL` configurado (CORS)
- [ ] `ANTHROPIC_API_KEY` configurado
- [ ] `OLLAMA_URL` acessível

### Deploy
- [ ] HTTPS forçado (não HTTP)
- [ ] SSL certificate válido
- [ ] Firewall configurado
- [ ] Rate limiting no nginx/proxy também
- [ ] Logs de erro configurados
- [ ] Monitoring configurado

---

## 5. Testes de Penetração Recomendados

### Nível Básico (10 min)
1. Testar cross-tenant access (User A → Project User B)
2. Testar XSS payloads (`<script>`, `onerror=`, etc)
3. Testar SQL injection (`'; DROP TABLE`, `UNION SELECT`, etc)
4. Testar rate limiting (send 101 requests)

### Nível Intermédio (30 min)
5. Testar path traversal (`../../../etc/passwd`)
6. Testar null bytes injection (`test\x00malicious`)
7. Testar LDAP injection (`*)(uid=*))(|(uid=*`)
8. Testar command injection (`; rm -rf /`)
9. Testar concurrent access (10 requests simultâneos)
10. Testar payload size (enviar 20MB)

### Nível Avançado (2 horas)
11. Automated fuzzing com OWASP ZAP
12. Automated scanning com Burp Suite
13. Race conditions testing
14. Session hijacking attempts
15. CSRF token bypass attempts

---

## 6. Monitoring de Segurança (Produção)

### Logs a Monitorizar

```bash
# Logs de rate limiting (429 errors)
tail -f /var/log/devforge/access.log | grep "429"

# Logs de acesso negado (404 errors em routes protegidas)
tail -f /var/log/devforge/access.log | grep "404.*api/projects"

# Logs de XSS attempts (payloads escapados)
tail -f /var/log/devforge/api.log | grep "sanitize"

# Logs de invalid UUID (400 errors)
tail -f /var/log/devforge/api.log | grep "Invalid.*format"
```

### Alertas Recomendados

1. **Rate Limiting Triggered** → Possível ataque
   - Threshold: 5+ users atingem limite em 5 min

2. **Cross-Tenant Access Attempts** → Possível breach
   - Threshold: 10+ 404 em projectos de outros users

3. **XSS Payloads Detectados** → Tentativa de ataque
   - Threshold: 5+ payloads escapados em 1 hora

4. **Invalid UUIDs** → Scanning/probing
   - Threshold: 20+ invalid UUIDs em 5 min

---

## 7. Incident Response

### Se detectar actividade suspeita:

1. **Imediato (< 1 min)**
   - Identificar user_id do atacante
   - Rate limit agressivo (1 req/min)
   - Log IP address

2. **Curto Prazo (< 5 min)**
   - Bloquear IP no firewall
   - Revocar sessões do user
   - Notificar equipa de segurança

3. **Investigação (< 1 hora)**
   - Analisar logs completos
   - Verificar se houve breach
   - Verificar outros users afectados
   - Patch vulnerabilidade se encontrada

4. **Pós-Incidente**
   - Relatório de incidente
   - Update security policies
   - Comunicar aos users se necessário
   - Melhorar monitoring

---

## 8. Comandos Úteis

### Ver Logs de Segurança

```bash
# Backend logs
cd studio/backend
tail -f logs/security.log

# Rate limiting hits
grep "Too Many Requests" logs/access.log | wc -l

# Cross-tenant access attempts
grep "404.*projects" logs/access.log | grep -v "user-id: $(user-id from project)"

# XSS attempts
grep "sanitize" logs/api.log
```

### Verificar Configuração

```bash
# Verificar rate limiting está activo
curl -I http://localhost:5680/api/projects | grep "X-RateLimit"

# Verificar helmet headers
curl -I http://localhost:5680 | grep "X-"

# Verificar CORS
curl -H "Origin: http://malicious.com" http://localhost:5680/api/projects
# Deve retornar erro CORS
```

### Database Queries

```sql
-- Ver users com mais requests (possíveis atacantes)
SELECT userId, COUNT(*) as requests
FROM AccessLog
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY userId
ORDER BY requests DESC
LIMIT 10;

-- Ver projectos mais acedidos (possível alvo)
SELECT projectId, COUNT(*) as accesses
FROM AccessLog
WHERE endpoint LIKE '%projects%'
GROUP BY projectId
ORDER BY accesses DESC
LIMIT 10;

-- Ver IPs com mais 404 errors (scanning)
SELECT ip, COUNT(*) as errors
FROM AccessLog
WHERE statusCode = 404
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ip
HAVING COUNT(*) > 20
ORDER BY errors DESC;
```

---

## 9. Security Maintenance Schedule

### Diário
- [ ] Revisar logs de rate limiting
- [ ] Verificar 404 errors anormais
- [ ] Backup database

### Semanal
- [ ] Executar `npm run test:security`
- [ ] Executar `./validate-security.sh`
- [ ] Verificar deps outdated (`npm outdated`)
- [ ] Revisar alertas de monitoring

### Mensal
- [ ] Audit completo de logs
- [ ] Penetration testing básico
- [ ] Update dependencies de segurança
- [ ] Revisar SECURITY-AUDIT.md

### Trimestral
- [ ] Penetration testing avançado (contratar terceiros)
- [ ] Security audit completo
- [ ] Update security policies
- [ ] Training equipa em segurança

---

## 10. Recursos Adicionais

### Documentação
- `SECURITY-AUDIT.md` - Relatório completo (9 páginas)
- `FASE-6-COMPLETA.md` - Resumo executivo
- `FASE-6-RESUMO.md` - Checklist detalhada

### Scripts
- `validate-security.sh` - 19 verificações automáticas
- `studio/backend/tests/security.test.ts` - Suite completa

### Links Úteis
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [Express Rate Limit](https://github.com/express-rate-limit/express-rate-limit)
- [Zod Validation](https://zod.dev/)

---

## Contactos de Emergência

**Security Team:**
- Email: security@devforge.com
- Slack: #security-alerts
- Phone: +XXX-XXX-XXXX (24/7)

**Incident Response:**
1. Slack #security-alerts
2. Email security@devforge.com
3. Call security lead

---

**Última actualização:** 2026-03-05
**Versão:** DevForge V2.0.0
**Próxima revisão:** 2026-04-05
