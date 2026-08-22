# Guia de Startup - Serviços da Aplicação

**Status:** Docker Desktop não está rodando  
**Solução:** Guia manual para subir serviços  

---

## ✅ Pré-requisitos

- [x] Node.js v24+ ✅
- [x] npm 11+ ✅
- [ ] Docker Desktop (precisa iniciar)
- [ ] PostgreSQL 16 (via Docker)

---

## 🚀 Opção 1: Docker Desktop (Recomendado)

### Passo 1: Iniciar Docker Desktop

```powershell
# Windows: Abrir aplicação "Docker Desktop"
# Ou terminal:
& "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Aguardar ~30 segundos até aparecer na bandeja
```

### Passo 2: Subir PostgreSQL

```bash
# Terminal 1 (PostgreSQL)
docker run -d `
  --name postgres-back-stage `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=back_stage `
  -p 5432:5432 `
  postgres:16

# Validar
docker ps | Select-String "postgres"
```

### Passo 3: Subir Backend

```bash
# Terminal 2 (Backend)
cd E:\_workspaces\_GitHub\back-stage
npm run dev

# Esperado: Backend rodando em http://localhost:3000
```

### Passo 4: Subir Frontend

```bash
# Terminal 3 (Frontend)
cd E:\_workspaces\_GitHub\back-stage\packages\frontend
npm install  # Primeira vez apenas
npm run dev

# Esperado: Frontend rodando em http://localhost:3001
```

---

## 🔄 Opção 2: Alternativa (sem Docker)

### Se Docker não estiver disponível:

```bash
# 1. Usar PostgreSQL local (se instalado)
# OU

# 2. Usar banco em memória para dev
set DATABASE_URL=sqlite::memory:
npm run dev

# OU

# 3. Usar serviço PostgreSQL cloud (AWS RDS, etc)
set DATABASE_URL=postgres://user:pass@host:5432/db
npm run dev
```

---

## 📋 Checklist de Startup

### Terminal 1: PostgreSQL
```
✅ docker ps
✅ postgres-back-stage rodando
✅ Port 5432 disponível
```

### Terminal 2: Backend
```bash
npm run dev
# Aguardar: "Server running on http://localhost:3000"
✅ Server started
✅ Database connected
✅ Ready for requests
```

### Terminal 3: Frontend
```bash
npm run dev
# Aguardar: "local: http://localhost:3001"
✅ Frontend started
✅ Connected to backend
✅ Ready to use
```

---

## 🔗 Acessar Aplicação

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:3001 | Abrir no browser |
| **Backend** | http://localhost:3000 | API interna |
| **Database** | localhost:5432 | PostgreSQL |
| **Health** | http://localhost:3000/health | Backend status |

---

## 🛠️ Comandos Úteis

### PostgreSQL
```bash
# Verificar status
docker ps | Select-String "postgres"

# Ver logs
docker logs postgres-back-stage

# Parar
docker stop postgres-back-stage

# Limpar dados
docker rm postgres-back-stage
```

### Backend
```bash
# Dev mode
npm run dev

# Production build
npm run build

# Run tests
npm test

# Check health
curl http://localhost:3000/health
```

### Frontend
```bash
# Dev mode
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

---

## ⚠️ Troubleshooting

### Docker Desktop não inicia
→ Reinstalar Docker Desktop  
→ Ou usar alternativa (banco local)

### PostgreSQL falha ao conectar
→ Verificar port 5432: `netstat -an | Select-String "5432"`  
→ Parar outro serviço usando porta 5432

### Backend não inicia
→ Verificar Node.js: `node --version`  
→ Reinstalar dependências: `npm ci`  
→ Limpar cache: `npm cache clean --force`

### Frontend não conecta ao backend
→ Verificar CORS settings  
→ Backend URL em `.env`: `VITE_API_URL=http://localhost:3000`  
→ Reiniciar frontend

---

## 📊 Componentes Rodando

```
┌─────────────────────────────────────┐
│     Frontend (3001)                 │
│  ├─ React/Vue                       │
│  └─ Conecta a Backend               │
└────────────┬────────────────────────┘
             │ HTTP
┌────────────▼────────────────────────┐
│     Backend (3000)                  │
│  ├─ Node.js/Express                 │
│  └─ Conecta a Database              │
└────────────┬────────────────────────┘
             │ TCP/IP
┌────────────▼────────────────────────┐
│     Database (5432)                 │
│  ├─ PostgreSQL 16                   │
│  └─ Persistência                    │
└─────────────────────────────────────┘
```

---

## ✅ Tudo Pronto?

Quando todos 3 serviços estiverem rodando:

1. ✅ Abrir http://localhost:3001
2. ✅ Frontend deve carregar
3. ✅ Backend deve responder
4. ✅ Database deve estar sincronizado
5. ✅ Pronto para usar!

---

## 🎯 Próximos Passos

- [ ] Iniciar Docker Desktop
- [ ] Subir PostgreSQL
- [ ] Rodar Backend (npm run dev)
- [ ] Rodar Frontend (npm run dev)
- [ ] Acessar http://localhost:3001
- [ ] Testar funcionalidades

---

**Data:** 2026-08-22  
**Status:** Ready to start services

Precisa de ajuda? Verifique /logs ou execute health check.
