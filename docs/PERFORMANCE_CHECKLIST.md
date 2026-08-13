# Checklist de Performance

## Backend

| Item | Status | Detalhe |
| --- | --- | --- |
| Connection pooling | ✅ | Knex configurado com pool `min: 2, max: 10` (`database/connection.ts`); em producao o Helm/K8s escala horizontalmente (HPA) em vez de aumentar pool por pod. |
| Compressao HTTP | ✅ | `compression()` (gzip) habilitado globalmente em `app.ts`. |
| Rate limiting | ✅ | `express-rate-limit` protege contra abuso/DoS acidental (`RATE_LIMIT_WINDOW_MS`/`RATE_LIMIT_MAX`). |
| Paginacao obrigatoria | ✅ | Todos os endpoints de listagem (`/services`, `/governance/policies`, `/deployments`, `/audit-logs`, `/catalog-entities`) sao paginados (`page`/`pageSize`, max 100). |
| Cache | ⚠️ | Redis provisionado (docker-compose + ElastiCache no Terraform) mas **ainda nao consumido pela aplicacao** — proximo passo natural: cache de leitura para `/search`, `/governance/dashboard` e `/catalog-entities/graph` (dados que mudam com baixa frequencia). |
| Observabilidade de latencia | ✅ | Histogramas Prometheus `backstage_http_request_duration_seconds` e `backstage_db_query_duration_seconds` (p95 visivel no dashboard Grafana). |
| N+1 queries | ✅ | Nenhum endpoint itera resultados fazendo queries adicionais por item; joins feitos no proprio SQL (ex.: `listCurrentViolations` usa `INNER JOIN` + CTE). |

## Database tuning (PostgreSQL)

| Item | Status | Detalhe |
| --- | --- | --- |
| Indices em foreign keys | ✅ | Todo FK possui indice dedicado (ex.: `catalog_entities_owner_team_id_index`, `deployments_entity_id_index`) — ver migrations da Fase 2. |
| Indices unicos parciais | ✅ | `WHERE deleted_at IS NULL` em todas as constraints de unicidade, evitando full scans em soft-deleted rows. |
| Full Text Search indexado | ✅ | Coluna gerada `search_vector` (tsvector) + indice GIN (`catalog_entities_search_vector_index`), evitando `ILIKE '%...%'` sem indice nas buscas globais. |
| Paginacao com `LIMIT`/`OFFSET` | ✅ | Todas as listagens usam `limit`/`offset` do Knex, nunca `SELECT *` sem limite. |
| `EXPLAIN ANALYZE` das queries criticas | ⚠️ | Nao executado nesta sessao — **requer PostgreSQL, indisponivel neste ambiente sandboxed** (mesma limitacao documentada desde a Fase 2). Recomendado antes do primeiro deploy: rodar `EXPLAIN ANALYZE` em `GET /search`, `GET /governance/violations` e `GET /catalog-entities/graph` (a mais pesada, faz full scan de `catalog_entities` + `catalog_entity_relations`). |
| Connection pooling no RDS | ✅ | `pool.max: 10` por instancia de backend; com HPA ate 10 replicas = 100 conexoes max, dentro do limite padrao do `db.t3.medium` (RDS Postgres 16). |

## Frontend

| Item | Status | Detalhe |
| --- | --- | --- |
| Code-splitting por rota | ✅ | `React.lazy` + `Suspense` em todas as 8 paginas (`app/router.tsx`). Bundle principal caiu de **386 KB → 298 KB** (gzip: 123 KB → 95 KB) nesta sessao; D3 (usado so em `ServiceDetailPage`) isolado em chunk de 66 KB carregado sob demanda. |
| React Query cache | ✅ | `staleTime: 30s`, `networkMode: 'always'`, `retry: 1` configurados globalmente (`lib/query-client.ts`), evitando refetch desnecessario. |
| Imagens/assets | N/A | Aplicacao nao usa imagens estaticas pesadas nesta fase. |
| CSS | ✅ | TailwindCSS com purge automatico via Vite (apenas classes usadas entram no bundle final, 10.44 KB gzip 2.8 KB). |
| Virtualizacao de listas longas | ⚠️ | Nao implementado — listas atuais sao paginadas no servidor (max 100 itens/pagina), suficiente para o volume atual; revisar se necessario para `DependencyGraph` com centenas de nodes. |

## Resultado mensurado (build de producao, Vite)

```
Antes (bundle unico):  index.js  386.09 kB  │ gzip: 123.39 kB
Depois (code-split):   index.js  297.93 kB  │ gzip:  94.65 kB
                        + 15 chunks lazy (maior: ServiceDetailPage 66.38 kB, so carrega na rota /catalog/:id)
```

## Proximos passos recomendados (fora do escopo desta sessao)

1. Adicionar cache Redis para `GET /search`, `GET /governance/dashboard` e `GET /catalog-entities/graph`.
2. Rodar `EXPLAIN ANALYZE` contra um PostgreSQL real e validar os planos de query das rotas listadas acima.
3. Considerar `k6`/`autocannon` para teste de carga do backend antes do primeiro deploy em producao (nao executado aqui por falta de ambiente com banco disponivel).
