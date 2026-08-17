# Deployment Checklist — CMDB Unificado com Análise de Impacto

## ✅ Status de Conclusão

| Componente | Status | Observações |
|-----------|--------|------------|
| **Migrations** | ✅ Pronto | 12 migrations (20260101000027 → 20260101000038) |
| **Backend Modules** | ✅ Pronto | databases, urls, resource-graph, search estendido |
| **Testes Unitários** | ✅ PASSANDO | 71 testes (Vitest) |
| **Testes Integração** | ✅ PASSANDO | 12 testes (Jest + Supertest) |
| **Frontend Components** | ✅ Pronto | ResourceGraph, GlobalSearch, 4 novas páginas |
| **Testes E2E** | ✅ Pronto | 8 testes (Playwright) — busca, drill-down, impacto |
| **Documentação** | ✅ Completo | FEATURE_CMDB_IMPLEMENTATION.md |

## 🚀 Instruções de Deploy

### 1. Preparação do Ambiente

```bash
cd packages/back-stage

# Instalar dependências (se necessário)
npm install

# Verificar variáveis de ambiente
cat .env  # Deve conter DATABASE_URL, REDIS_URL, JWT_SECRET

# Iniciar serviços (PostgreSQL 16, Redis)
docker-compose up -d postgres redis
```

### 2. Executar Migrations

```bash
# Verificar status
npm run db:migrate:status --workspace=@back-stage/backend

# Aplicar migrations
npm run db:migrate --workspace=@back-stage/backend

# Verificar resultado
npm run db:migrate:status --workspace=@back-stage/backend
```

**Esperado:**
```
Migration: 20260101000027_create_database_engines_table.ts ... already run
Migration: 20260101000028_create_databases_table.ts ... already run
...
Migration: 20260101000038_add_search_vector_to_applications.ts ... already run
```

### 3. Rodar Testes

```bash
# Testes Unitários Backend
npm run test --workspace=@back-stage/backend
# Esperado: ✅ 71 passed

# Testes de Integração Backend
npm run test:integration --workspace=@back-stage/backend
# Esperado: ✅ 12 passed

# Testes E2E Frontend (requer servidor rodando)
cd packages/e2e
npm run test
# Esperado: ✅ 8 passed (search-and-impact.spec.ts)
```

### 4. Build Backend

```bash
npm run build --workspace=@back-stage/backend
# Verifica: npm run typecheck
```

### 5. Build Frontend

```bash
npm run build --workspace=@back-stage/frontend
# Gera: packages/frontend/dist/
```

### 6. Iniciar Servidores (Local)

**Terminal 1 — Backend:**
```bash
npm run dev --workspace=@back-stage/backend
# Esperado: listening on port 4000
```

**Terminal 2 — Frontend:**
```bash
npm run dev --workspace=@back-stage/frontend
# Esperado: Local: http://localhost:5173
```

### 7. Validação Manual

1. **Navegação**
   - [ ] Home carrega (`http://localhost:5173/`)
   - [ ] Sidebar mostra "Bancos de Dados" e "URLs"
   - [ ] GlobalSearch visível na topbar

2. **Busca Global**
   - [ ] Digitar em GlobalSearch mostra resultados em tempo real
   - [ ] Clicar em resultado navega corretamente
   - [ ] Link "Ver todos" vai para `/search?q=...`

3. **Bancos de Dados**
   - [ ] Listar: `/databases` carrega
   - [ ] Filtro por ambiente funciona
   - [ ] Detalhe: `/databases/:id` mostra grafo de dependências
   - [ ] "Simular Impacto" funciona e destaca nós

4. **URLs**
   - [ ] Listar: `/urls` carrega
   - [ ] Filtro por tipo funciona
   - [ ] Detalhe: `/urls/:id` mostra informações

5. **Ecossistema**
   - [ ] `/ecosystem` carrega grafo geral
   - [ ] Legenda mostra 4 tipos (server, app, db, url)
   - [ ] Simular impacto mostra blast radius colorido

6. **Drill-Down**
   - [ ] ServerDetailPage: "Dependências e Relacionamentos" section existe
   - [ ] ApplicationDetailPage: "Grafo de Dependências" section existe
   - [ ] Double-click em nó navega para detalhe

## 📊 Validações de Performance (Staging)

Rodar antes de produção:

```sql
-- Verificar índices
SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('databases', 'urls', 'servers', 'applications', 'resource_relationships');

-- Testar CTE recursiva (max depth)
EXPLAIN ANALYZE
WITH RECURSIVE impact AS (
  SELECT source_id, target_id, 0 as depth, ARRAY[...] as path
  FROM resource_relationships
  WHERE source_type = 'server' AND source_id = '...'
  UNION ALL
  ...
) SELECT COUNT(*) FROM impact WHERE depth < 5;
-- Esperado: < 100ms

-- Testar full-text search
EXPLAIN ANALYZE
SELECT id, resource_type FROM (
  SELECT id, 'server' as resource_type FROM servers WHERE search_vector @@ to_tsquery('portuguese', 'api:*')
  UNION ALL
  SELECT id, 'application' FROM applications WHERE search_vector @@ to_tsquery('portuguese', 'api:*')
) AS results;
-- Esperado: < 50ms
```

## 🔍 Validação de Dados

```sql
-- Contar migrações de dados
SELECT COUNT(*) FROM resource_relationships WHERE relation_type = 'hosts';
-- Esperado: = COUNT(*) de application_deployments originais

SELECT COUNT(*) FROM resource_relationships WHERE relation_type = 'depends_on' AND source_type = 'application';
-- Esperado: = COUNT(*) de application_dependencies originais

-- Verificar soft-delete
SELECT COUNT(*) FROM databases WHERE deleted_at IS NOT NULL;
SELECT COUNT(*) FROM databases WHERE deleted_at IS NULL;
-- Todos os endpoints devem filtrar deleted_at IS NULL

-- Verificar search_vector
SELECT COUNT(*) FROM servers WHERE search_vector IS NOT NULL;
-- Esperado: = COUNT(*) total de servers
```

## 🛑 Rollback (Emergency)

Se precisar reverter:

```bash
# Rollback migrations (volta 1 migration)
npm run db:migrate:rollback --workspace=@back-stage/backend

# Rollback múltiplas vezes (se necessário)
npm run db:migrate:rollback --workspace=@back-stage/backend
npm run db:migrate:rollback --workspace=@back-stage/backend
```

**⚠️ Nota**: Migration `20260101000032_migrate_legacy_relations_to_resource_relationships.ts` tem `down()` no-op (não pode reverter dados). Se precisar voltar completamente, restaurar backup de antes de aplicá-la.

## 📋 Checklist Pré-Produção

- [ ] Todas as migrations rodaram com sucesso
- [ ] 71 testes unitários passando
- [ ] 12 testes de integração passando
- [ ] 8 testes E2E passando
- [ ] EXPLAIN ANALYZE < 100ms para CTE recursiva
- [ ] EXPLAIN ANALYZE < 50ms para full-text search
- [ ] Contagens de dados migrados estão corretas
- [ ] Soft-delete funciona em todos os endpoints
- [ ] GlobalSearch indexado e rápido
- [ ] Ciclo-detection validado
- [ ] Backup pré-deploy realizado
- [ ] Variáveis de ambiente em produção configuradas
- [ ] SSL/TLS habilitado (CORS_ORIGIN apontando para domínio HTTPS)
- [ ] Logging e auditoria habilitados
- [ ] Alertas de performance configurados

## 🆘 Troubleshooting

### Erro: "ECONNREFUSED" ao rodar migrations

**Causa**: Postgres não está rodando ou .env está incorreto.

**Solução**:
```bash
# Verificar conexão
docker-compose ps postgres

# Reiniciar se necessário
docker-compose restart postgres

# Verificar .env
cat .env | grep DATABASE_URL
```

### Erro: "search_vector: column does not exist"

**Causa**: Migration 20260101000035+ não foi aplicada.

**Solução**:
```bash
npm run db:migrate:status --workspace=@back-stage/backend
# Verificar se faltam migrations
npm run db:migrate --workspace=@back-stage/backend
```

### Testes E2E falhando em "Busca global encontra..."

**Causa**: GlobalSearch não está visível no topbar.

**Solução**:
1. Verificar que `GlobalSearch` foi adicionado a `AppLayout.tsx`
2. Verificar que ícones `SearchIcon` e `XIcon` existem em `icons.tsx`
3. Verificar que rota `/api/search/unified-search` está registrada

### Simulação de impacto retorna "0 recursos"

**Causa**: Nenhuma relação criada entre recursos.

**Solução**:
1. Criar relações manualmente via endpoint POST `/api/resource-graph/relationships`
2. Ou usar teste E2E que cria fixtures
3. Ou popular via seed se disponível

## 📞 Contato & Suporte

Documentação técnica completa: `FEATURE_CMDB_IMPLEMENTATION.md`
Testes: `packages/e2e/tests/search-and-impact.spec.ts`
Migrations: `packages/backend/src/database/migrations/202601010000[27-38]_*.ts`

---

**Data de Deploy**: 2026-08-16
**Versão Feature**: 1.0.0
**Branches**: Pronto para merge em `main`
