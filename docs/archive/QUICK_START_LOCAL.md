# Quick Start — Rodando CMDB Localmente

**Tempo estimado**: 10-15 minutos
**Pré-requisitos**: Node.js 18+, PostgreSQL 16, Redis 7, Git

---

## 🚀 Passo 1: Clonar & Instalar Dependências

```bash
cd e:\_workspaces\_GitHub\back-stage

# Instalar dependências (monorepo)
npm install

# Verificar
npm --version
node --version
```

---

## 🗄️ Passo 2: Iniciar Banco de Dados

### Opção A: Docker Compose (Recomendado)

```bash
# Iniciar PostgreSQL + Redis
docker-compose up -d postgres redis

# Verificar
docker-compose ps
# Esperado: postgres e redis "Up"

# Aguardar ~5 segundos para postgres ficar pronto
sleep 5
```

### Opção B: Postgres + Redis Local (Manual)

Se Docker não estiver disponível:

```bash
# PostgreSQL (assumindo instalado)
# Windows: Services → PostgreSQL → Start
# Mac: brew services start postgresql@16
# Linux: sudo systemctl start postgresql

# Redis (assumindo instalado)
# Windows: redis-server.exe (em terminal separado)
# Mac: brew services start redis
# Linux: sudo systemctl start redis-server

# Verificar conexão
psql -h localhost -U backstage -d backstage -c "SELECT 1;"
# Esperado: (1 row)

redis-cli ping
# Esperado: PONG
```

---

## 📊 Passo 3: Aplicar Migrations

```bash
# Terminal 1 — Apply migrations
cd e:\_workspaces\_GitHub\back-stage

npm run db:migrate --workspace=@back-stage/backend

# Verificar status
npm run db:migrate:status --workspace=@back-stage/backend

# Esperado:
# Migration: 20260101000027_create_database_engines_table.ts ✓
# Migration: 20260101000028_create_databases_table.ts ✓
# ... (todas 12 migrations)
```

---

## 🎯 Passo 4: Iniciar Backend

```bash
# Terminal 2 — Backend
cd e:\_workspaces\_GitHub\back-stage

npm run dev --workspace=@back-stage/backend

# Esperado output:
# ✓ Type check: pass
# → Server listening on http://localhost:4000
# → Environment: development
```

**Backend pronto em**: `http://localhost:4000`

---

## 🎨 Passo 5: Iniciar Frontend

```bash
# Terminal 3 — Frontend
cd e:\_workspaces\_GitHub\back-stage

npm run dev --workspace=@back-stage/frontend

# Esperado output:
#   VITE v5.x ready in XXX ms
#   ➜  Local:   http://localhost:5173/
#   ➜  press h + enter to show help
```

**Frontend pronto em**: `http://localhost:5173`

---

## ✅ Passo 6: Acessar & Testar

### Login

1. Abrir browser: **http://localhost:5173**
2. Usuário: `admin`
3. Senha: `Tectrs123`
4. Clicar "Entrar"

**Dashboard carrega**: http://localhost:5173/

### Testar Features

#### 🔍 Busca Global
- Topbar superior: input "Buscar servidores, apps, bases..."
- Digite `api` → Resultados em dropdown
- Clique em resultado → Navega para detalhe

#### 🗄️ Bancos de Dados
- Menu lateral: **Bancos de Dados**
- URL: http://localhost:5173/databases
- Clique em um banco → Detalhe com grafo de dependências
- Botão **Simular Impacto** → Mostra blast radius

#### 🔗 URLs
- Menu lateral: **URLs**
- URL: http://localhost:5173/urls
- Filtro por tipo → Atualiza listagem

#### 🌐 Ecossistema
- Menu lateral: **Ecossistema**
- URL: http://localhost:5173/ecosystem
- Grafo interativo com 4 tipos de recursos
- **Simular Impacto** → Destaca impactados em vermelho

---

## 🔧 Testar API Diretamente

### Health Check
```bash
curl http://localhost:4000/api/health
# Esperado: {"status":"ok"}
```

### Listar Databases
```bash
# Nota: Precisa de token JWT válido (obter do login)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/databases
# Esperado: {"items":[],"pagination":{...}}
```

### Busca Unificada
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:4000/api/search/unified-search?q=api"
# Esperado: {"items":[...],"pagination":{...}}
```

---

## 🐛 Troubleshooting

### "ECONNREFUSED" ao rodar migrations
**Causa**: Postgres não está rodando

**Solução**:
```bash
# Verificar status
docker-compose ps postgres
# ou
psql -h localhost -c "SELECT 1;"

# Iniciar se necessário
docker-compose up -d postgres
sleep 5
```

### "Port 4000 already in use"
**Causa**: Backend já rodando em outra porta

**Solução**:
```bash
# Encontrar processo
lsof -i :4000
# ou em PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 4000).OwningProcess

# Matar processo
kill -9 <PID>
# ou em PowerShell:
Stop-Process -Id <PID> -Force
```

### "Port 5173 already in use"
**Causa**: Frontend já rodando

**Solução**:
```bash
# Mesmo procedimento acima
lsof -i :5173
```

### "Cannot find psql"
**Causa**: PostgreSQL não instalado ou não em PATH

**Solução**:
```bash
# Windows: Adicionar ao PATH
# C:\Program Files\PostgreSQL\16\bin

# Mac: Instalar via Homebrew
brew install postgresql@16

# Linux: Instalar via apt
sudo apt-get install postgresql-client
```

---

## 📝 Environment Variables

Arquivo `.env` já existe com defaults:

```bash
# Database
DATABASE_URL=postgres://backstage:backstage@localhost:5432/backstage
POSTGRES_USER=backstage
POSTGRES_PASSWORD=backstage
POSTGRES_DB=backstage
POSTGRES_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379

# Ports
BACKEND_PORT=4000
FRONTEND_PORT=5173

# JWT
JWT_SECRET=dev-insecure-secret-change-me
JWT_EXPIRES_IN=1h

# CORS
CORS_ORIGIN=http://localhost:5200
```

**Para alterar**, edite `.env` e reinicie os serviços.

---

## 🎬 Scripts Úteis

### Rodar Testes
```bash
# Backend unitários
npm run test --workspace=@back-stage/backend

# Backend integração
npm run test:integration --workspace=@back-stage/backend

# Frontend E2E (requer servidor rodando)
npm run test:e2e --workspace=@back-stage/e2e
```

### Build para Produção
```bash
# Backend
npm run build --workspace=@back-stage/backend

# Frontend
npm run build --workspace=@back-stage/frontend

# Outputs em:
# - packages/backend/dist/
# - packages/frontend/dist/
```

### Limpar Cache
```bash
# Remove node_modules (cuidado: vai fazer reinstall)
npm run clean

# Remove build outputs
npm run clean --workspace=@back-stage/backend
npm run clean --workspace=@back-stage/frontend
```

---

## 🔗 Telas Principais

| Tela | URL | Descrição |
|------|-----|-----------|
| Dashboard | http://localhost:5173/ | Home |
| Bancos de Dados | http://localhost:5173/databases | Listagem |
| Banco Detalhe | http://localhost:5173/databases/ID | Detalhe + grafo |
| URLs | http://localhost:5173/urls | Listagem |
| URL Detalhe | http://localhost:5173/urls/ID | Detalhe |
| Servidores | http://localhost:5173/servers | Listagem (existente) |
| Servidor Detalhe | http://localhost:5173/servers/ID | Detalhe com grafo novo |
| Aplicações | http://localhost:5173/applications | Listagem (existente) |
| App Detalhe | http://localhost:5173/applications/ID | Detalhe com grafo novo |
| Ecossistema | http://localhost:5173/ecosystem | Grafo completo |
| Busca | http://localhost:5173/search?q=termo | Resultados globais |

---

## 📖 API Docs

### OpenAPI/Swagger
```
http://localhost:4000/api/docs
```

Abre interface Swagger com todos os endpoints documentados.

### Endpoints Principais

**Databases**:
- GET /api/databases
- GET /api/databases/:id
- POST /api/databases
- PUT /api/databases/:id
- DELETE /api/databases/:id

**URLs**:
- GET /api/urls
- GET /api/urls/:id
- POST /api/urls
- PUT /api/urls/:id
- DELETE /api/urls/:id

**Resource Graph**:
- GET /api/resource-graph (full graph)
- GET /api/resource-graph/:type/:id/subgraph (drill-down)
- POST /api/resource-graph/simulate-impact (blast radius)

**Search**:
- GET /api/search/unified-search?q=termo (busca global)
- GET /api/search/suggestions?q=termo (autocomplete)

---

## 🚦 Status de Saúde

### Backend Saudável
```bash
curl http://localhost:4000/api/health | jq '.'
# Esperado: {"status":"ok"}
```

### Frontend Respondendo
```bash
curl http://localhost:5173/ | head -20
# Esperado: HTML com <title> e scripts
```

### Database Conectado
```bash
psql -h localhost -U backstage -d backstage -c "\dt"
# Esperado: Lista de tabelas (servers, applications, databases, urls, etc.)
```

### Redis Respondendo
```bash
redis-cli ping
# Esperado: PONG
```

---

## 💡 Dicas

1. **Múltiplos Terminais**: Abra 3 terminais (migrations, backend, frontend)
2. **VS Code**: Abra pasta raiz em VS Code para editar código com hot-reload
3. **DevTools**: Chrome DevTools habilitadas no Frontend (F12)
4. **Logs**: Backend logs mostram requests em tempo real
5. **Hard Refresh**: Ctrl+Shift+R no browser para limpar cache

---

## 🆘 Precisa de Ajuda?

1. Verificar logs do backend: Procurar por erros em Terminal 2
2. Verificar console do frontend: F12 → Console tab
3. Verificar banco: `psql -h localhost -U backstage -d backstage`
4. Ler documentação: `FEATURE_CMDB_IMPLEMENTATION.md`

---

**Pronto para começar? Siga os passos acima e acesse http://localhost:5173** 🚀

Login: `admin` / `Tectrs123`
