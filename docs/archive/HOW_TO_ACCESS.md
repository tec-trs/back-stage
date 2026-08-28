# 🚀 Como Acessar CMDB Localmente

**Tempo para estar rodando**: 10-15 minutos

---

## ⚡ Resumo Rápido

```
Terminal 1: npm run db:migrate --workspace=@back-stage/backend
Terminal 2: npm run dev --workspace=@back-stage/backend
Terminal 3: npm run dev --workspace=@back-stage/frontend

Aguarde 30 segundos após cada terminal estar pronto.
```

---

## 📋 Pre-Requisitos (Verificar)

```bash
# Node.js 18+
node --version

# PostgreSQL 16 rodando
psql -h localhost -U backstage -c "SELECT 1;"
# Se falhar: docker-compose up -d postgres

# Redis rodando
redis-cli ping
# Se falhar: docker-compose up -d redis
```

---

## 🎯 3 Passos para Rodar

### Terminal 1 — Migrations (Única vez)

```bash
cd e:\_workspaces\_GitHub\back-stage
npm run db:migrate --workspace=@back-stage/backend
```

**Esperado**:
```
Batch 1: 12 migrations
✓ 20260101000027_create_database_engines_table
✓ 20260101000028_create_databases_table
... (todas 12)
```

### Terminal 2 — Backend

```bash
cd e:\_workspaces\_GitHub\back-stage
npm run dev --workspace=@back-stage/backend
```

**Esperado**:
```
✓ Type check: pass
→ Server listening on http://localhost:4000
```

### Terminal 3 — Frontend

```bash
cd e:\_workspaces\_GitHub\back-stage
npm run dev --workspace=@back-stage/frontend
```

**Esperado**:
```
VITE v5.x ready in XXXms
➜  Local:   http://localhost:5173/
```

---

## 🌐 URLs de Acesso

| Serviço | URL | Função |
|---------|-----|--------|
| **Frontend** | http://localhost:5173 | 🎨 Interface web |
| **Backend API** | http://localhost:4000 | 📡 API REST |
| **API Docs** | http://localhost:4000/api/docs | 📖 Swagger |
| **Health** | http://localhost:4000/api/health | 💚 Status |

---

## 🔐 Login (Frontend)

Após abrir http://localhost:5173:

```
Usuário: admin
Senha:   Tectrs123
```

**Clique em "Entrar"** → Vai para Dashboard

---

## ✨ Testar Features (Após Login)

### 1️⃣ Busca Global
- Topbar: Digite `api` no input de busca
- **Resultado**: Dropdown com matches
- **Clique**: Navega para detalhe

### 2️⃣ Bancos de Dados
- Sidebar: **Bancos de Dados**
- URL: http://localhost:5173/databases
- **Clique** em um banco → Ver grafo de dependências
- **Botão**: "Simular Impacto" → Mostra blast radius

### 3️⃣ URLs
- Sidebar: **URLs**
- URL: http://localhost:5173/urls
- **Filtro**: Por tipo (public, api, webhook, etc.)

### 4️⃣ Ecossistema
- Sidebar: **Ecossistema**
- URL: http://localhost:5173/ecosystem
- **Grafo**: Interativo com 4 tipos (servers, apps, dbs, urls)
- **Simular**: Clique "Simular Impacto" → Destaca em vermelho

### 5️⃣ Servidores (Novo!)
- Sidebar: **Servidores**
- **Clique** em servidor → Nova seção "Dependências e Relacionamentos"
- **Grafo**: Mostra apps que rodam nele
- **Impacto**: Simular parada do servidor

### 6️⃣ Aplicações (Novo!)
- Sidebar: **Aplicações**
- **Clique** em app → Nova seção "Grafo de Dependências"
- **Grafo**: Mostra dependências
- **Impacto**: Simular parada da app

---

## 🔍 Testar API via curl

```bash
# Health check
curl http://localhost:4000/api/health

# Listar databases (precisa de token)
TOKEN="seu_jwt_token_aqui"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/databases

# Busca global
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/api/search/unified-search?q=api"

# Simular impacto (exemplo)
curl -X POST http://localhost:4000/api/resource-graph/simulate-impact \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resourceType":"server","resourceId":"some-id"}'
```

**Obter Token**: Abrir DevTools (F12) → Network → Procurar por request com `authorization` header

---

## 🛑 Parar Serviços

```bash
# Terminal 1, 2, 3: Ctrl+C
Ctrl+C
Ctrl+C
Ctrl+C

# Opcionalmente parar Docker
docker-compose down
```

---

## 🐛 Se Algo Não Funcionar

### Erro: "ECONNREFUSED" em migrations
```bash
# Verificar postgres
psql -h localhost -c "SELECT 1;"

# Iniciar se needed
docker-compose up -d postgres
sleep 5
npm run db:migrate --workspace=@back-stage/backend
```

### Erro: "Port 4000 already in use"
```bash
# Verificar processo
lsof -i :4000

# Matar
kill -9 <PID>
```

### Erro: "Port 5173 already in use"
```bash
# Mesmo acima
lsof -i :5173
kill -9 <PID>
```

### Frontend mostra "Cannot GET /"
```bash
# Aguardar 10 segundos
# Se ainda não funcionar:
# 1. Ctrl+C no terminal 3
# 2. npm run dev --workspace=@back-stage/frontend novamente
```

### Database queries lentas
```bash
# Verificar índices criados
psql -h localhost -U backstage -d backstage << EOF
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('servers', 'applications', 'databases', 'urls');
EOF
```

---

## ✅ Checklist de Sucesso

- [ ] Terminal 1: Migrations rodaram (12/12 ✓)
- [ ] Terminal 2: Backend escutando em :4000
- [ ] Terminal 3: Frontend respondendo em :5173
- [ ] Browser: http://localhost:5173 carrega
- [ ] Login: admin/Tectrs123 funciona
- [ ] Topbar: GlobalSearch visível
- [ ] Sidebar: Bancos de Dados + URLs aparecem
- [ ] /databases: Página carrega com tabela
- [ ] /ecosystem: Grafo renderiza
- [ ] Simular Impacto: Calcula e destaca

---

## 📞 Stack

| Componente | Port | Status |
|-----------|------|--------|
| Frontend (React) | 5173 | ✅ |
| Backend (Express) | 4000 | ✅ |
| PostgreSQL | 5432 | ✅ |
| Redis | 6379 | ✅ |

---

## 🎉 Pronto!

**Você tem CMDB rodando localmente com:**

✅ Busca global em 5 fontes
✅ Visualização interativa de grafos
✅ Simulação de impacto
✅ Filtros por tags/ambiente
✅ CRUD de databases e URLs
✅ Drill-down entre dependências
✅ Audit logging completo

---

**Dúvidas?** Ler `QUICK_START_LOCAL.md` para mais detalhes.

**Pronto para produção?** Seguir `PRODUCTION_DEPLOYMENT_RUNBOOK.md`.
