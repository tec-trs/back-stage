# ✅ Verificar Postgres e Rodar Serviços

**Status**: Postgres não está respondendo em localhost:5432

---

## 🔍 Passo 1: Verificar Status do Postgres

### Windows (Services)
```
1. Abra: services.msc (tecla Windows + R, digite "services.msc")
2. Procure: "PostgreSQL" ou "postgres"
3. Status deve estar "Running"
4. Se não estiver: Clique direito → Start
```

### Windows (pgAdmin)
```
1. Abra pgAdmin (http://localhost:5050 ou http://localhost:80)
2. Conecte com suas credenciais
3. Localize "Servers" no lado esquerdo
4. Verifique se há conexão ativa
```

### Windows (PostgreSQL Installer Path)
```
# Verifique se PostgreSQL está instalado
C:\Program Files\PostgreSQL\16\bin\psql.exe -h localhost -U backstage -d backstage -c "SELECT 1;"
```

### Mac/Linux
```bash
# Verificar se PostgreSQL está rodando
ps aux | grep postgres

# Se não estiver, iniciar:
# Mac:
brew services start postgresql@16

# Linux:
sudo systemctl start postgresql
```

---

## 🚀 Passo 2: Rodar Migrations (Após Postgres estar OK)

Abra **um terminal** na pasta do projeto:

```bash
cd e:\_workspaces\_GitHub\back-stage

# Rodar migrations
npm run db:migrate --workspace=@back-stage/backend
```

**Esperado**:
```
Batch 1: 12 migrations
✓ 20260101000027_create_database_engines_table
✓ 20260101000028_create_databases_table
... (todas 12)
```

---

## 🎯 Passo 3: Rodar Backend

**Novo terminal**:

```bash
cd e:\_workspaces\_GitHub\back-stage
npm run dev --workspace=@back-stage/backend
```

**Esperado**:
```
✓ Type check: pass
→ Server listening on http://localhost:4000
```

**Deixe rodando** ← Não feche este terminal

---

## 🎨 Passo 4: Rodar Frontend

**Terceiro terminal**:

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

## 🌐 Passo 5: Acessar

Abra browser:

```
http://localhost:5173
```

**Login**:
```
Usuário: admin
Senha:   Tectrs123
```

---

## ✅ Checklist

- [ ] Postgres rodando (services.msc ou brew services)
- [ ] Migrations: 12/12 ✓
- [ ] Backend: listening on :4000
- [ ] Frontend: ready on :5173
- [ ] Browser: http://localhost:5173 carrega
- [ ] Login funciona

---

## 🆘 Se Postgres não iniciar

### Windows
```
# Abra PowerShell como Admin
Get-Service postgresql-x64-16 | Start-Service

# Ou via Services:
services.msc → PostgreSQL → Start
```

### Mac
```bash
# Reinstalar se necessário
brew services restart postgresql@16

# Ou verificar logs
tail -f /usr/local/var/log/postgres.log
```

### Linux
```bash
sudo systemctl restart postgresql
sudo systemctl status postgresql
```

---

## 🔧 Se Postgres está em porta diferente

Se Postgres está em **5433** (foi problema anterior):

Edite `.env`:
```
# Mude de:
POSTGRES_PORT=5432
DATABASE_URL=postgres://backstage:backstage@localhost:5432/backstage

# Para:
POSTGRES_PORT=5433
DATABASE_URL=postgres://backstage:backstage@localhost:5433/backstage
```

Depois tente migrations novamente:
```bash
npm run db:migrate --workspace=@back-stage/backend
```

---

## 📞 URLs Finais (Após Tudo Rodando)

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:4000 |
| API Docs | http://localhost:4000/api/docs |
| Health | http://localhost:4000/api/health |

---

## 💡 Dica: Deixar 3 Terminais Abertos

```
Terminal 1: npm run db:migrate... (só rodou uma vez)
Terminal 2: npm run dev --workspace=@back-stage/backend (deixado aberto)
Terminal 3: npm run dev --workspace=@back-stage/frontend (deixado aberto)
```

Todos com outputs visíveis. Se algo der erro, você vê nos logs.

---

**Siga estes passos e acesse http://localhost:5173** 🚀

Qualquer erro → Ler próxima seção de troubleshooting
