# back-stage

Platform Engineering Center — plataforma corporativa inspirada em Backstage, Spotify Portal Engineering, Internal Developer Platforms e CNCF Platform Engineering Principles.

## Estrutura do monorepo

```
back-stage/
├── packages/
│   ├── shared/    # tipos, erros e utilitarios compartilhados (@back-stage/shared)
│   ├── backend/   # API Node + Express + TypeScript (@back-stage/backend)
│   ├── frontend/  # React 19 + Vite + TypeScript (@back-stage/frontend)
│   └── cli/       # CLI de operacao e scaffolding (@back-stage/cli)
├── observability/ # Prometheus, Grafana, Loki, Promtail (configuracao)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Pre-requisitos

- Node.js >= 20
- npm >= 10
- Docker e Docker Compose (Postgres, Redis, Kafka, Prometheus, Grafana, Loki)

## Como comecar

```bash
npm install
cp .env.example .env
docker compose up -d postgres redis zookeeper kafka
npm run build:shared
npm run db:migrate --workspace=@back-stage/backend
npm run db:seed --workspace=@back-stage/backend
npm run dev:backend
npm run dev:frontend
```

- Backend: http://localhost:4000/api/health
- Swagger/OpenAPI: http://localhost:4000/api/docs
- Metricas Prometheus: http://localhost:4000/metrics
- Frontend: http://localhost:5173 (login: codigo de usuario `admin` / senha `Tectrs123`)

## Scripts principais

| Script                 | Descricao                                 |
| ---------------------- | ----------------------------------------- |
| `npm run build`        | Builda todos os pacotes (shared primeiro) |
| `npm run lint`         | Lint em todo o monorepo                   |
| `npm run format`       | Formata com Prettier                      |
| `npm run typecheck`    | Verifica tipos em todos os pacotes        |
| `npm test`             | Executa os testes de todos os pacotes     |
| `npm run dev:backend`  | Sobe o backend em modo watch              |
| `npm run dev:frontend` | Sobe o frontend em modo dev (Vite)        |

## Arquitetura

- **Backend**: Modular Monolith, DDD (domain / application / infrastructure / interfaces), Repository Pattern, Service Layer, injecao de dependencia manual via `Container`. Cada modulo em `src/modules/*` e autocontido (auth, service-catalog, governance, search, catalog, audit, deployments).
- **Frontend**: Feature Based Architecture (`features/`, `shared/`, `layouts/`, `pages/`), React Router com rotas protegidas, React Query para estado de servidor, Zustand (persistido) para sessao/UI, TailwindCSS, Error Boundary.

## Camada de persistencia (PostgreSQL 16 + Knex)

| Script                                                        | Descricao                            |
| ------------------------------------------------------------- | ------------------------------------ |
| `npm run db:migrate --workspace=@back-stage/backend`          | Aplica todas as migrations pendentes |
| `npm run db:migrate:rollback --workspace=@back-stage/backend` | Reverte o ultimo batch de migrations |
| `npm run db:migrate:status --workspace=@back-stage/backend`   | Lista o status das migrations        |
| `npm run db:seed --workspace=@back-stage/backend`             | Executa os seeds (idempotentes)      |

Regras do schema: UUID (`gen_random_uuid()`), trigger `set_updated_at()` em todas as tabelas mutaveis (exceto `audit_logs`, imutavel), soft delete (`deleted_at` + indices unicos parciais), foreign keys obrigatorias, JSONB restrito a `metadata`, busca full-text via coluna gerada `search_vector` (GIN index).

## API (visao geral)

Todas as rotas sob `/api`. Autenticacao via JWT Bearer (`POST /api/auth/login`), RBAC por papel (`admin`, `maintainer`, `viewer`).

| Recurso            | Rotas                                                                                                                                                                                                                                        | Modulo                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| Auth               | `POST /auth/login`, `GET /auth/me`                                                                                                                                                                                                           | `modules/auth`            |
| Service Catalog    | `GET/POST /services`, `GET/PUT/DELETE /services/:id`, `GET /services/search`                                                                                                                                                                 | `modules/service-catalog` |
| Catalog (generico) | `GET /catalog-entities`, `GET /catalog-entities/:id`, `GET /catalog-entities/graph`                                                                                                                                                          | `modules/catalog`         |
| Governance         | `GET/POST /governance/policies`, `POST /governance/policies/:id/evaluate[/:entityId]`, `GET /governance/violations`, `GET /governance/dashboard`, `GET/POST /governance/exemptions`, `PUT /governance/exemptions/:id/approve` (ou `/reject`) | `modules/governance`      |
| Search             | `GET /search`, `GET /suggestions`                                                                                                                                                                                                            | `modules/search`          |
| Audit              | `GET /audit-logs`                                                                                                                                                                                                                            | `modules/audit`           |
| Deployments        | `GET/POST /deployments`, `GET /deployments/:id`                                                                                                                                                                                              | `modules/deployments`     |
| Webhooks           | `POST /webhooks/github`, `POST /webhooks/gitlab`                                                                                                                                                                                             | `modules/deployments`     |
| Observabilidade    | `GET /metrics` (fora de `/api`)                                                                                                                                                                                                              | `observability/`          |

Documentacao interativa completa (OpenAPI/Swagger): http://localhost:4000/api/docs

## Webhooks (Deployment Tracking)

- **GitHub**: configure um webhook para o evento `deployment_status` apontando para `POST /api/webhooks/github`, com `Content type: application/json` e o secret igual a `GITHUB_WEBHOOK_SECRET`. A assinatura e validada via HMAC-SHA256 (`X-Hub-Signature-256`).
- **GitLab**: configure um Pipeline Hook apontando para `POST /api/webhooks/gitlab`, com o token igual a `GITLAB_WEBHOOK_SECRET` (header `X-Gitlab-Token`).
- Eventos normalizados: `deployment.started`, `deployment.completed`, `deployment.failed`. O deployment e casado com uma entidade do catalogo pela `repository_url` e o historico e persistido em `deployments` + `audit_logs`.

## Observabilidade

```bash
docker compose up -d prometheus grafana loki promtail
```

- **Prometheus**: http://localhost:9090 — scrape do backend em `/metrics` (config em `observability/prometheus/prometheus.yml`, alertas em `alerts.yml`).
- **Grafana**: http://localhost:3000 (`admin`/`admin` por padrao) — dashboard "Back-Stage / Platform Overview" provisionado automaticamente, com datasources Prometheus, Loki e PostgreSQL.
- **Loki + Promtail**: coletam logs estruturados (JSON, via Winston) dos containers Docker.
- **Tracing**: instrumentado via OpenTelemetry SDK (auto-instrumentation HTTP/Express/PG), exportando OTLP para `OTEL_EXPORTER_OTLP_ENDPOINT` (aponte para um collector/backend compativel, ex. Tempo/Jaeger, quando disponivel).

KPIs no dashboard: **API latency** (p95 por rota), **DB latency** (p95 por operacao), **Error Rate**, **Deployment Success Rate**, **MTTR** (SQL sobre `deployments`), **Availability** (`up` do Prometheus).

## Infraestrutura e CI/CD

```
helm/back-stage/       # Chart Helm (Deployment/Service/ConfigMap/Secret/HPA/Ingress) para backend + frontend
terraform/              # Infraestrutura base AWS (VPC, EKS, RDS, ElastiCache, ECR)
.github/workflows/
  ci.yml                # Lint, typecheck, testes, build, docker build
  build.yml             # Build + push das imagens para GHCR
  cd.yml                # Deploy via Helm (staging/production)
  security-scan.yml     # npm audit, CodeQL, Trivy (filesystem + imagens)
```

```bash
# Deploy manual (com um cluster/kubeconfig configurados)
helm upgrade --install back-stage ./helm/back-stage \
  --namespace back-stage --create-namespace \
  --set backend.image.tag=<tag> --set frontend.image.tag=<tag> \
  --set secret.data.DATABASE_URL=<...> --set secret.data.JWT_SECRET=<...>
```

Ver `terraform/README.md` para provisionar a infraestrutura base na AWS.

## Testes e qualidade

| Suite                          | Comando                                                              | Ferramenta                     |
| ------------------------------ | -------------------------------------------------------------------- | ------------------------------ |
| Unidade (backend)              | `npm run test --workspace=@back-stage/backend`                       | Vitest                         |
| Integracao HTTP (backend)      | `npm run test:integration --workspace=@back-stage/backend`           | Jest + Supertest               |
| Componentes/paginas (frontend) | `npm run test --workspace=@back-stage/frontend`                      | Vitest + React Testing Library |
| E2E                            | `npm run test:e2e --workspace=@back-stage/e2e`                       | Playwright                     |
| Cobertura                      | `npm run test:coverage --workspace=@back-stage/backend` / `frontend` | Vitest coverage (v8)           |

Documentos gerados na Fase 12 (Hardening): [`docs/COVERAGE_REPORT.md`](docs/COVERAGE_REPORT.md), [`docs/SECURITY_CHECKLIST.md`](docs/SECURITY_CHECKLIST.md), [`docs/PERFORMANCE_CHECKLIST.md`](docs/PERFORMANCE_CHECKLIST.md).

## Fases

- **Fase 1 — Foundation**: monorepo, packages, CI basico, Docker local.
- **Fase 2 — Database**: PostgreSQL 16, Knex, migrations, seeds.
- **Fase 3 — Backend Core**: Express, JWT + RBAC, request-id, OpenAPI, validation (zod), error handler global, Winston + Morgan.
- **Fase 4 — Service Catalog**: CRUD completo, paginacao, filtros, ordenacao, auditoria.
- **Fase 5 — Governance**: Policy Engine (equals/contains/greaterThan/lessThan), compliance dashboard, violations, exemptions.
- **Fase 6 — Search**: PostgreSQL Full Text Search (tsvector + GIN), autocomplete, facets, ranking.
- **Fase 7 — Frontend**: 8 paginas, rotas protegidas, Error Boundary, React Query + Zustand + Tailwind.
- **Fase 8 — Dependency Graph**: `DependencyGraph.tsx` com D3.js (zoom/pan/drag/selecao/navegacao).
- **Fase 9 — Audit/Deployments/Webhooks**: deployment tracking, integracao GitHub Actions/GitLab CI.
- **Fase 10 — Observabilidade**: OpenTelemetry, Prometheus, Grafana, Loki.
- **Fase 11 — CI/CD**: Kubernetes (Helm), Terraform (AWS), GitHub Actions (build/deploy/security-scan).
- **Fase 12 — Hardening**: Jest+Supertest, Vitest+RTL, Playwright E2E, relatorio de cobertura, checklist de seguranca (OWASP Top 10) e de performance, code-splitting do bundle. _(atual)_
