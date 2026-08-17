# Staging Validation Plan — CMDB Unificado

**Objetivo**: Validar a feature completa em staging antes de produção.
**Duração Estimada**: 2-3 horas
**Data Alvo**: Após approval de code review

## 📋 Pré-Requisitos

- [ ] Ambiente staging provisionado (postgres, redis, backend, frontend)
- [ ] Database staging restaurado com dados de produção (últimos 7 dias)
- [ ] SSL/TLS configurado
- [ ] Monitoring (Prometheus, Grafana) ativo
- [ ] ELK/Logs centralizados
- [ ] Backup automático agendado

## 🧪 Fase 1: Deployment (30-45 min)

### Step 1.1 — Apply Migrations

```bash
# SSH to backend server
ssh staging-backend-01

# Backup database
pg_dump -h postgres.staging -U backstage -d backstage -F c > /backups/backstage-pre-cmdb.dump

# Apply migrations
npm run db:migrate --workspace=@back-stage/backend

# Verify
npm run db:migrate:status --workspace=@back-stage/backend
```

**Checkpoints**:
- [ ] Todas 12 migrations aplicadas
- [ ] Tabelas novas visíveis em psql: `SELECT * FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('database_engines', 'databases', 'url_types', 'urls', 'resource_relationships');`
- [ ] Índices criados: `SELECT indexname FROM pg_indexes WHERE tablename IN ('servers', 'applications', 'databases', 'urls');`

### Step 1.2 — Deploy Backend

```bash
# Build
npm run build --workspace=@back-stage/backend

# Copy to server
scp packages/backend/dist/* staging-backend-01:/app/backend/dist/

# Restart service
ssh staging-backend-01 "systemctl restart backstage-backend"

# Health check
curl -s https://api.staging.example.com/api/health | jq '.'
```

**Checkpoints**:
- [ ] Backend health check = 200 OK
- [ ] Logs mostram "Server listening on :4000"
- [ ] Endpoints novos respondendo (GET /api/databases, POST /api/search/unified-search)

### Step 1.3 — Deploy Frontend

```bash
# Build
npm run build --workspace=@back-stage/frontend

# Deploy to CDN/static
aws s3 sync packages/frontend/dist s3://backstage-staging-ui/

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E123456 --paths "/*"

# Verify
curl -s https://staging.example.com/ | grep -i "Global Search\|GlobalSearch"
```

**Checkpoints**:
- [ ] Frontend load = < 3s
- [ ] No 404s em assets
- [ ] Topbar mostra GlobalSearch input

---

## 🧪 Fase 2: Smoke Tests (30 min)

### Step 2.1 — Busca Global

```bash
# Test unifiedSearch endpoint directly
curl -s "https://api.staging.example.com/api/search/unified-search?q=prod&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.items | length'
# Expected: > 0
```

**Manual Tests**:
- [ ] Topbar GlobalSearch input aceita input
- [ ] Resultados aparecem em dropdown após 500ms
- [ ] Clicar em resultado navega corretamente
- [ ] "Ver todos os resultados" leva para /search?q=...

### Step 2.2 — Databases CRUD

```bash
# Create
curl -X POST "https://api.staging.example.com/api/databases" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "staging-test-db",
    "displayName": "Staging Test DB",
    "engine": "postgres",
    "criticality": "low",
    "environment": "staging",
    "status": "active"
  }'
# Expected: 201 Created

# Read
curl -s "https://api.staging.example.com/api/databases" \
  -H "Authorization: Bearer $TOKEN" | jq '.items | length'
# Expected: > 0

# Filter by environment
curl -s "https://api.staging.example.com/api/databases?environment=staging" \
  -H "Authorization: Bearer $TOKEN" | jq '.pagination.total'
# Expected: > 0
```

**Manual Tests**:
- [ ] /databases page carrega
- [ ] Filtro por ambiente funciona
- [ ] Clique em database vai para /databases/:id
- [ ] Grafo de dependências renderiza

### Step 2.3 — URLs CRUD

```bash
# Create
curl -X POST "https://api.staging.example.com/api/urls" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Staging Health Check",
    "url": "https://api.staging.example.com/health",
    "urlType": "api",
    "ownerResourceType": "application",
    "ownerResourceId": "some-app-id",
    "status": "active"
  }'
```

**Manual Tests**:
- [ ] /urls page carrega
- [ ] Filtro por tipo funciona
- [ ] Detalhes de URL corretos

### Step 2.4 — Ecossistema & Grafo

**Manual Tests**:
- [ ] /ecosystem carrega
- [ ] Grafo renderiza com nós dos 4 tipos (server, app, db, url)
- [ ] Legenda mostra cores corretas
- [ ] MiniMap visível
- [ ] Controls (zoom, fit) funcionam

### Step 2.5 — Simulação de Impacto

**Manual Tests**:
- [ ] Botão "Simular Impacto" clicável
- [ ] Resultado aparece < 2s
- [ ] Nós impactados destacados em vermelho
- [ ] Painel de impacto mostra contagem total
- [ ] Breakdown por tipo/profundidade correto

---

## 🧪 Fase 3: Performance Validation (30 min)

### Step 3.1 — Query Performance

```bash
# Connect to staging DB
psql -h postgres.staging -U backstage -d backstage

# Check index usage
EXPLAIN ANALYZE
SELECT * FROM servers WHERE search_vector @@ to_tsquery('portuguese', 'prod:*');
-- Expected: Seq Scan on servers or Index Scan (uses index)
-- Time: < 50ms

# Check CTE recursion
EXPLAIN ANALYZE
WITH RECURSIVE impact AS (
  SELECT source_id, target_id, 0 as depth, ARRAY[source_id] as path
  FROM resource_relationships
  WHERE source_type = 'server' AND source_id = 'some-id'
  UNION ALL
  SELECT impact.source_id, rr.target_id, impact.depth + 1, 
         array_append(impact.path, rr.target_id)
  FROM resource_relationships rr
  JOIN impact ON rr.source_id = impact.target_id
  WHERE impact.depth < 5 AND NOT (rr.target_id = ANY(impact.path))
) SELECT COUNT(*) FROM impact;
-- Expected: Time < 100ms
```

**Checkpoints**:
- [ ] Full-text search < 50ms
- [ ] CTE recursion < 100ms
- [ ] Grafo completo (500 nós) loads < 2s

### Step 3.2 — Monitoring

```bash
# Check backend latency
curl -s https://prometheus.staging:9090/api/v1/query?query=histogram_quantile(0.95,rate(http_request_duration_seconds_bucket[5m])) | jq '.'
# Expected: < 200ms for 95th percentile

# Check database pool
curl -s https://prometheus.staging:9090/api/v1/query?query=mysql_global_status_threads_connected | jq '.'
# Expected: < 80% of max_connections
```

**Checkpoints**:
- [ ] API latency p95 < 200ms
- [ ] Database connections < 80% max
- [ ] No error rate spike (< 0.1% 5xx)

---

## 🧪 Fase 4: Data Integrity (30 min)

### Step 4.1 — Migration Counts

```bash
# Verify legacy data migrated
SELECT 'application_deployments' as source, COUNT(*) as original FROM pg_dump
UNION ALL
SELECT 'resource_relationships (hosts)' as source, COUNT(*) 
FROM resource_relationships WHERE relation_type = 'hosts';
-- Expected: matches

SELECT 'application_dependencies' as source, COUNT(*) as original
UNION ALL
SELECT 'resource_relationships (depends_on)' as source, COUNT(*)
FROM resource_relationships 
WHERE relation_type = 'depends_on' AND source_type = 'application';
-- Expected: matches
```

**Checkpoints**:
- [ ] Contagem de edges hosts = original deployments
- [ ] Contagem de edges depends_on (app→app) = original dependencies
- [ ] Nenhuma duplicata criada

### Step 4.2 — Soft-Delete Filtering

```bash
# Verify deleted_at filtering works
SELECT 'servers (active)' as table_name, COUNT(*) 
FROM servers WHERE deleted_at IS NULL
UNION ALL
SELECT 'servers (deleted)', COUNT(*) 
FROM servers WHERE deleted_at IS NOT NULL;

# Verify API doesn't return deleted resources
curl -s "https://api.staging.example.com/api/servers" \
  -H "Authorization: Bearer $TOKEN" | jq '.items[] | select(.deleted_at != null) | length'
# Expected: 0 (empty array)
```

**Checkpoints**:
- [ ] Soft-deleted records não aparecem em listagens
- [ ] Soft-deleted records não aparecem em grafos
- [ ] Audit log registra todas deletes

### Step 4.3 — Cycle Detection

```bash
# Create a cycle manually and test
# A → B → C → A

# Try to simulate impact on A
curl -X POST "https://api.staging.example.com/api/resource-graph/simulate-impact" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"resourceType": "application", "resourceId": "A-id"}'

# Should complete without hanging and return hasCycle: true
jq '.hasCycle'
# Expected: true
```

**Checkpoints**:
- [ ] CTE completa < 2s mesmo com ciclo
- [ ] hasCycle flag marcado corretamente
- [ ] Sem timeout ou 500 errors

---

## 🧪 Fase 5: User Acceptance (30 min)

### Step 5.1 — Busca

**Tester**: Procurar por "prod"
- [ ] Encontra servidores, apps, bancos, URLs
- [ ] Resultados ordenados por relevância
- [ ] Pode navegar direto para um resultado

**Tester**: Busca por tag "critical"
- [ ] (Futuro) Filtro de tags funciona
- [ ] Resultados mostram apenas críticos

### Step 5.2 — Drill-Down

**Tester**: Ir para detalhe de um servidor
- [ ] "Dependências e Relacionamentos" visível
- [ ] Grafo renderiza com aplicações que rodam nele
- [ ] Double-click em app navega para detalhe da app

### Step 5.3 — Impacto

**Tester**: Simular parada de servidor crítico
- [ ] "Simular Impacto" botão clicável
- [ ] Resultado mostra quantidade de recursos afetados
- [ ] Grafo destaca nós afetados

---

## 📊 Acceptance Criteria

| Critério | Status | Notes |
|----------|--------|-------|
| Zero crashes | ⬜ | Backend/frontend logs limpos |
| Response time < 2s | ⬜ | API 95p < 200ms, Frontend FCP < 3s |
| Search finds all 5 sources | ⬜ | Servers, apps, databases, urls, catalog |
| Grafo renders without lag | ⬜ | React Flow + dagre smooth |
| Impact simulation < 2s | ⬜ | CTE executa rápido |
| Soft-delete working | ⬜ | Deleted resources não aparecem |
| Cycle detection working | ⬜ | CTE completa com hasCycle flag |
| Audit logging complete | ⬜ | Todas mutações registradas |

---

## 🔄 Rollback Plan

Se qualquer critério falhar:

```bash
# 1. Rollback backend
ssh staging-backend-01 "git checkout main && npm run build && systemctl restart backstage-backend"

# 2. Rollback frontend
aws s3 sync s3://backstage-staging-ui-backup s3://backstage-staging-ui/
aws cloudfront create-invalidation --distribution-id E123456 --paths "/*"

# 3. Rollback database (if critical)
pg_restore -h postgres.staging -U backstage -d backstage /backups/backstage-pre-cmdb.dump

# 4. Notify team
# Send message to #deployments Slack channel
```

---

## ✅ Sign-Off

- [ ] QA Lead — Smoke tests OK
- [ ] Performance Engineer — Latency acceptable
- [ ] Data Engineer — Integrity verified
- [ ] Product Manager — UAT approved
- [ ] DevOps — Ready for production

**Staging Validation Date**: ___________
**Next Step**: Production deployment following DEPLOYMENT_CHECKLIST.md

---

**Expected Outcome**: Ready for production OR back to dev team for fixes
**Timeline**: 2-3 hours if all tests pass
**Risk Level**: 🟡 MEDIUM (large feature, high visibility)
