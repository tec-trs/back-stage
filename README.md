# Back-Stage — Platform Engineering Center

Plataforma corporativa de gestao de infraestrutura e aplicacoes, inspirada em Backstage/Spotify, Internal Developer Platforms e CNCF Platform Engineering Principles.

Construida como monorepo npm workspaces com backend DDD + frontend React 19.

---

## Indice

1. [Visao geral](#visao-geral)
2. [Estrutura do monorepo](#estrutura-do-monorepo)
3. [Pre-requisitos e inicio rapido](#pre-requisitos-e-inicio-rapido)
4. [Modulos funcionais](#modulos-funcionais)
5. [Arquitetura — Backend](#arquitetura--backend)
6. [Arquitetura — Frontend](#arquitetura--frontend)
7. [Banco de dados](#banco-de-dados)
8. [API](#api)
9. [Autenticacao e RBAC](#autenticacao-e-rbac)
10. [Auditoria](#auditoria)
11. [Ecossistema — Grafo D3.js](#ecossistema--grafo-d3js)
12. [Observabilidade](#observabilidade)
13. [CI/CD e infraestrutura](#cicd-e-infraestrutura)
14. [Testes](#testes)
15. [Scripts](#scripts)

---

## Visao geral

O Back-Stage e um **Internal Developer Portal** que consolida em uma unica interface:

- Inventario de **servidores** (fisicos, virtuais, cloud, containers) com campos de rede, discos e servicos
- Catalogo de **aplicacoes** com dependencias, implantacoes e ciclo de vida
- **Grafo do ecossistema** — visualizacao interativa das relacoes servidor-aplicacao
- **Governanca** — motor de politicas e painel de conformidade
- **Auditoria** — trilha completa de eventos com filtros e exclusao em lote
- **Gestao de usuarios** com controle de acesso baseado em papeis (RBAC)
- **Observabilidade** — metricas Prometheus, dashboards Grafana, logs Loki

---

## Estrutura do monorepo

```
back-stage/
├── packages/
│   ├── shared/          # tipos, erros e utilitarios (@back-stage/shared)
│   ├── backend/         # API Express + DDD + Knex/PostgreSQL (@back-stage/backend)
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/            # JWT login, /me
│   │       │   ├── servers/         # CRUD servidores (rede, discos, servicos)
│   │       │   ├── applications/    # CRUD aplicacoes (deps, implantacoes)
│   │       │   ├── service-catalog/ # Catalogo generico de entidades
│   │       │   ├── catalog/         # Grafo de dependencias (ecossistema)
│   │       │   ├── governance/      # Motor de politicas e compliance
│   │       │   ├── search/          # Full Text Search (PostgreSQL)
│   │       │   ├── audit/           # Trilha de auditoria
│   │       │   ├── deployments/     # Deployment tracking + webhooks
│   │       │   └── users/           # CRUD usuarios
│   │       ├── database/
│   │       │   ├── migrations/      # 23+ migrations Knex
│   │       │   └── seeds/           # Seeds idempotentes
│   │       └── shared/              # middlewares, erros, DI, audit-logger
│   ├── frontend/        # React 19 + Vite + TailwindCSS (@back-stage/frontend)
│   │   └── src/
│   │       ├── features/            # feature modules (auth, servers, applications, audit...)
│   │       ├── pages/               # paginas de rota
│   │       ├── layouts/             # AppLayout (sidebar com icones, header)
│   │       └── shared/              # componentes, hooks e constantes reutilizaveis
│   └── cli/             # CLI de operacao e scaffolding (@back-stage/cli)
├── observability/       # Prometheus, Grafana, Loki, Promtail
├── helm/back-stage/     # Chart Helm para Kubernetes
├── terraform/           # Infraestrutura AWS (VPC, EKS, RDS, ECR)
├── docker-compose.yml
└── .github/workflows/   # CI/CD (ci, build, cd, security-scan)
```

---

## Pre-requisitos e inicio rapido

**Requisitos:**
- Node.js >= 20, npm >= 10
- Docker e Docker Compose (PostgreSQL 16, Redis, Kafka, Prometheus, Grafana, Loki)

```bash
# 1. Clonar e instalar dependencias
git clone <repo>
cd back-stage
npm install

# 2. Configurar variaveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais (DATABASE_URL, JWT_SECRET, etc.)

# 3. Subir infraestrutura local
docker compose up -d postgres redis zookeeper kafka

# 4. Migracoes e seeds
npm run build:shared
npm run db:migrate --workspace=@back-stage/backend
npm run db:seed --workspace=@back-stage/backend

# 5. Iniciar backend e frontend
npm run dev:backend     # http://localhost:4000
npm run dev:frontend    # http://localhost:5200
```

**Acesso padrao:**
- Frontend: http://localhost:5200
- Backend/API: http://localhost:4000/api/health
- Swagger/OpenAPI: http://localhost:4000/api/docs
- Metricas Prometheus: http://localhost:4000/metrics
- Login: codigo `admin` / senha `Tectrs123`

---

## Modulos funcionais

### Servidores

Cadastro e gestao do inventario de servidores com 4 abas:

| Aba | Campos |
|-----|--------|
| **Geral** | Hostname (validado no blur, RFC-1123), nome de exibicao, tipo (fisico/virtual/cloud/container/...), provedor, ambiente, status operacional, descricao |
| **Rede** | Endereco IP, dominio, gateway, mascara de rede, VLAN, Nome FQDN |
| **Discos** | Lista de discos (tipo, tamanho GB, ponto de montagem, filesystem) |
| **Servicos** | Lista de servicos do servidor (nome, situacao, portas, cmd subir/parar/status) |

**Funcionalidades:**
- Listagem com filtros (status, tipo, provedor, ambiente, busca)
- Detalhe do servidor com todas as abas
- Duplicar servidor (abre formulario pre-preenchido)
- Desativar/ativar (altera status)
- Eliminar com protecao: nao permite exclusao se houver aplicacoes implantadas
- Auditoria automatica de todas as operacoes

### Aplicacoes

Catalogo de aplicacoes com:
- Tipo (Web, API, Batch, Mobile, etc.), criticidade, status de ciclo de vida
- Dependencias de outras aplicacoes (multi-select com checkboxes)
- Implantacoes em servidores (deployment tracking)
- Duplicar aplicacao
- Botao de inativar e eliminar

### Ecossistema

Grafo interativo (D3.js force simulation) mostrando servidores e aplicacoes:
- **Servidores** — nos quadrados (rect) em ciano `#22d3ee`
- **Aplicacoes** — nos redondos (circle) em verde-lima `#a3e635`
- Labels posicionados acima dos nos (sem sobreposicao)
- Zoom, pan, drag de nos
- Clique: seleciona no e exibe nome/tipo na barra
- Duplo clique: navega para a tela de detalhe do servidor ou aplicacao
- Cor da borda indica ciclo de vida (verde=ativo, amarelo=manutencao, vermelho=desativado, etc.)

### Auditoria

Trilha completa de eventos com:
- Filtro por acao (campo texto livre) e tipo de recurso (dropdown)
- Multi-select por linha (checkbox) + selecionar todos
- Botao "Eliminar (N)" com dialogo de confirmacao
- Total de registros exibido no rodape
- Papeis: leitura `admin`/`maintainer`, escrita `admin`

### Usuarios

Gestao de acesso com:
- Multi-select por checkbox (selecionar varios usuarios simultaneamente)
- Bulk inativar/ativar — respeita usuarios inativos/ativos, exclui a propria conta automaticamente
- Bulk eliminar com dialogo de confirmacao
- Editar: habilitado apenas com exatamente 1 usuario selecionado
- Aviso visual quando a propria conta esta na selecao

### Governanca

- Motor de politicas (equals/contains/greaterThan/lessThan) aplicado a entidades do catalogo
- Painel de conformidade com violations e exemptions
- Aprovacao/rejeicao de exempcoes por administradores

---

## Arquitetura — Backend

Modular Monolith com **Domain-Driven Design**. Cada modulo em `src/modules/*` e autocontido:

```
modules/<nome>/
├── domain/         # entidades, value objects, interfaces de repositorio
├── application/    # servicos de aplicacao (use cases)
├── infrastructure/ # repositorios Knex (PostgreSQL)
└── interfaces/
    └── http/       # controller, routes, validation (Zod)
```

**Tecnologias backend:**
- Express 4 + TypeScript 5 (ESM)
- Knex + PostgreSQL 16 (queries builder, migrations, seeds)
- Zod (validacao de entrada)
- JWT (autenticacao), RBAC por middleware
- Winston + Morgan (logging estruturado JSON)
- OpenTelemetry (tracing HTTP/Express/PG)
- Prometheus (metricas via `prom-client`)
- Injecao de dependencia manual via `Container` (sem framework IoC externo)

**Padroes:**
- Repository Pattern com interface + implementacao Knex
- Service Layer (logica de negocio, auditoria, validacoes de dominio)
- `asyncHandler` para captura uniforme de erros async
- Global error handler com mapeamento de erros do dominio para HTTP (400/401/403/404/409/500)
- Soft delete em todas as entidades (`deleted_at`, indices unicos parciais)

---

## Arquitetura — Frontend

**Feature Based Architecture** com React 19 + Vite + TypeScript:

```
src/
├── features/           # modulos por dominio
│   ├── auth/           # store Zustand, hook de login
│   ├── servers/        # hooks React Query + formulario com abas
│   ├── applications/   # hooks + formulario
│   ├── audit/          # hooks de listagem e exclusao
│   └── users/          # hooks de CRUD de usuarios
├── pages/              # ServersPage, ApplicationsPage, AuditPage, etc.
├── layouts/            # AppLayout (sidebar com icones, header)
└── shared/
    ├── api/            # http-client (fetch + JWT + ApiError)
    ├── components/     # Button, Modal, ConfirmDialog, DependencyGraph, icons, ...
    └── constants/      # labels de traducao (PT-BR)
```

**Tecnologias frontend:**
- React 19, React Router 6 (rotas protegidas)
- TanStack Query v5 (React Query) — cache, invalidacao, mutacoes
- Zustand v5 (sessao auth persistida no localStorage)
- TailwindCSS 3 (design system slate/sky)
- D3.js v7 (grafo do ecossistema)
- Vitest + React Testing Library (testes de componentes)

**Componentes reutilizaveis notaveis:**
- `ConfirmDialog` — dialogo de confirmacao com suporte a erro embutido (substitui `window.confirm`)
- `DependencyGraph` — grafo D3 force com zoom/pan/drag, nos quadrados (servidor) e redondos (aplicacao)
- `Button` — variantes primary/secondary/danger/ghost com icone e tamanhos sm/md
- `Modal` — portal React com Escape, backdrop e acessibilidade (role=dialog, aria-modal)
- `PageHeader`, `EmptyState`, `ErrorMessage`, `Spinner`, `Badge` — UI atoms

---

## Banco de dados

PostgreSQL 16 gerenciado via Knex.

**Convencoes do schema:**
- UUID via `gen_random_uuid()` como PK
- Trigger `set_updated_at()` em todas as tabelas mutaveis (exceto `audit_logs`)
- Soft delete: coluna `deleted_at` + indices unicos parciais (`WHERE deleted_at IS NULL`)
- FKs obrigatorias com `ON DELETE RESTRICT` ou `CASCADE` conforme o dominio
- Full Text Search via coluna gerada `search_vector` (GIN index) nas entidades pesquisaveis
- `metadata` sempre JSONB

**Tabelas principais:**

| Tabela | Descricao |
|--------|-----------|
| `users` | Usuarios da plataforma (codigo, email, senha hash bcrypt, papeis JSONB) |
| `servers` | Servidores (hostname, tipo, provedor, ambiente, status, rede, dominio) |
| `server_disks` | Discos de cada servidor (N:1 com servers) |
| `server_services` | Servicos de cada servidor (N:1 com servers) |
| `applications` | Aplicacoes (tipo, criticidade, status, repositorio) |
| `application_dependencies` | Dependencias entre aplicacoes (N:M) |
| `application_deployments` | Implantacoes de aplicacoes em servidores (N:M) |
| `catalog_entities` | Entidades genericas do catalogo (services, systems, domains...) |
| `catalog_edges` | Arestas de relacionamento entre entidades do catalogo |
| `governance_policies` | Politicas de conformidade (regras + campos alvo) |
| `governance_violations` | Violacoes detectadas pelo motor de politicas |
| `governance_exemptions` | Exempcoes aprovadas/rejeitadas |
| `deployments` | Historico de deployments (GitHub Actions / GitLab CI) |
| `audit_logs` | Trilha de auditoria (imutavel, sem updated_at, sem soft delete) |

**Comandos de banco:**

```bash
npm run db:migrate --workspace=@back-stage/backend          # aplica migrations pendentes
npm run db:migrate:rollback --workspace=@back-stage/backend # reverte ultimo batch
npm run db:migrate:status --workspace=@back-stage/backend   # status das migrations
npm run db:seed --workspace=@back-stage/backend             # executa seeds (idempotentes)
```

---

## API

Todas as rotas sob `/api`. Documentacao interativa em http://localhost:4000/api/docs

### Auth

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/auth/login` | Login (retorna JWT, 7 dias) |
| GET | `/api/auth/me` | Dados do usuario autenticado |

### Servidores

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/servers` | Lista com paginacao e filtros |
| POST | `/api/servers` | Cria servidor |
| GET | `/api/servers/:id` | Detalhe do servidor |
| PUT | `/api/servers/:id` | Atualiza servidor |
| PUT | `/api/servers/:id/status` | Altera status operacional |
| DELETE | `/api/servers/:id` | Remove servidor (soft delete; falha se tiver aplicacoes) |

### Aplicacoes

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/applications` | Lista com paginacao e filtros |
| POST | `/api/applications` | Cria aplicacao |
| GET | `/api/applications/:id` | Detalhe da aplicacao |
| PUT | `/api/applications/:id` | Atualiza aplicacao |
| PUT | `/api/applications/:id/status` | Altera status |
| DELETE | `/api/applications/:id` | Remove aplicacao (soft delete) |

### Ecossistema

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/ecosystem/graph` | Grafo de nos (servidores + aplicacoes) e arestas |

### Usuarios

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/users` | Lista usuarios |
| POST | `/api/users` | Cria usuario |
| PUT | `/api/users/:id` | Atualiza usuario |
| PUT | `/api/users/:id/activate` | Ativa usuario |
| PUT | `/api/users/:id/deactivate` | Desativa usuario |
| DELETE | `/api/users/:id` | Remove usuario |

### Auditoria

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/audit-logs` | Lista com filtros (action, resourceType, actorUserId, page, pageSize) |
| DELETE | `/api/audit-logs` | Exclui registros por IDs (body: `{ ids: string[] }`) |

### Catalogo e Governance

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET/POST | `/api/services` | CRUD de servicos do catalogo |
| GET/PUT/DELETE | `/api/services/:id` | Operacoes por ID |
| GET | `/api/services/search` | Busca full-text |
| GET | `/api/catalog-entities` | Lista entidades do catalogo |
| GET | `/api/catalog-entities/graph` | Grafo de dependencias do catalogo |
| GET/POST | `/api/governance/policies` | Politicas de conformidade |
| POST | `/api/governance/policies/:id/evaluate` | Avalia politica contra todas as entidades |
| GET | `/api/governance/violations` | Violacoes detectadas |
| GET | `/api/governance/dashboard` | Painel de compliance |
| GET/POST | `/api/governance/exemptions` | Exempcoes |
| PUT | `/api/governance/exemptions/:id/approve` | Aprova exempcao |
| PUT | `/api/governance/exemptions/:id/reject` | Rejeita exempcao |

### Webhooks

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/webhooks/github` | Recebe deployment_status do GitHub (HMAC-SHA256) |
| POST | `/api/webhooks/gitlab` | Recebe Pipeline Hook do GitLab (X-Gitlab-Token) |

---

## Autenticacao e RBAC

**JWT Bearer Token** — expiracão: 7 dias.

| Papel | Permissoes |
|-------|-----------|
| `admin` | Acesso total (leitura + escrita + exclusao + gestao de usuarios) |
| `maintainer` | Leitura + escrita (sem exclusao de servidores nem gestao de usuarios) |
| `viewer` | Somente leitura |

O usuario pode ter multiplos papeis (array JSON).

Rotas de exclusao de servidores e gestao de `audit-logs` (DELETE) requerem papel `admin`.

---

## Auditoria

Todas as operacoes de criacao, edicao, exclusao e alteracao de status geram um registro em `audit_logs` com:
- `actorUserId` — quem executou
- `action` — ex.: `server.created`, `application.status_changed`, `user.deleted`
- `resourceType` e `resourceId` — o que foi afetado
- `ipAddress` e `userAgent` — contexto da requisicao
- `metadata` — dados adicionais (JSONB)

Os registros de auditoria sao **imutaveis** (sem `updated_at`, sem soft delete). A exclusao via `DELETE /api/audit-logs` e restrita ao papel `admin` e requer confirmacao explicita.

---

## Ecossistema — Grafo D3.js

O componente `DependencyGraph` usa D3.js force simulation para visualizar a topologia:

**Nos:**
- `server` — **quadrado** (rect 36×36, rx=4), cor `#22d3ee` (ciano)
- `application` e demais — **circulo** (r=18), cor `#a3e635` (verde-lima)
- A cor da **borda** indica o ciclo de vida:
  - Verde `#34d399` — ativo / production
  - Amarelo `#fbbf24` — manutencao / experimental
  - Azul `#38bdf8` — provisionando
  - Roxo `#a78bfa` — em desenvolvimento
  - Vermelho `#f87171` — desativado / deprecated
- **Label** posicionado acima do no (y = -26, text-anchor: middle) — sem sobreposicao

**Interacao:**
- Zoom/pan na area do grafo
- Drag de nos individuais
- Clique simples: seleciona no
- Duplo clique: navega para `/servers/:id` ou `/applications/:id`

---

## Observabilidade

```bash
docker compose up -d prometheus grafana loki promtail
```

| Servico | URL | Descricao |
|---------|-----|-----------|
| Prometheus | http://localhost:9090 | Scrape do backend em `/metrics` |
| Grafana | http://localhost:3000 | Dashboards (admin/admin por padrao) |
| Loki | http://localhost:3100 | Agregacao de logs estruturados |
| Promtail | — | Coleta logs dos containers Docker |

**Dashboard provisionado:** "Back-Stage / Platform Overview" — KPIs: API latency p95, DB latency p95, Error Rate, Deployment Success Rate, MTTR, Availability.

**Tracing:** OpenTelemetry SDK (HTTP/Express/PG), exporte OTLP para `OTEL_EXPORTER_OTLP_ENDPOINT` (Tempo/Jaeger).

**Alertas:** configurados em `observability/prometheus/alerts.yml` — API down, high error rate, high latency.

---

## CI/CD e infraestrutura

**GitHub Actions:**

| Workflow | Descricao |
|----------|-----------|
| `ci.yml` | Lint + typecheck + testes + build (em todo PR e push) |
| `build.yml` | Build e push das imagens Docker para GHCR |
| `cd.yml` | Deploy via Helm para staging/production |
| `security-scan.yml` | `npm audit`, CodeQL, Trivy (filesystem + imagens) |

**Kubernetes (Helm):**
```bash
helm upgrade --install back-stage ./helm/back-stage \
  --namespace back-stage --create-namespace \
  --set backend.image.tag=<tag> \
  --set frontend.image.tag=<tag> \
  --set secret.data.DATABASE_URL=<url> \
  --set secret.data.JWT_SECRET=<secret>
```

**Terraform (AWS):** VPC, EKS, RDS PostgreSQL, ElastiCache Redis, ECR. Ver `terraform/README.md`.

---

## Testes

| Suite | Comando | Ferramenta |
|-------|---------|-----------|
| Unidade backend | `npm run test --workspace=@back-stage/backend` | Vitest |
| Integracao HTTP | `npm run test:integration --workspace=@back-stage/backend` | Vitest + Supertest |
| Componentes frontend | `npm run test --workspace=@back-stage/frontend` | Vitest + React Testing Library |
| E2E | `npm run test:e2e` | Playwright |
| Cobertura backend | `npm run test:coverage --workspace=@back-stage/backend` | Vitest coverage v8 |
| Cobertura frontend | `npm run test:coverage --workspace=@back-stage/frontend` | Vitest coverage v8 |

---

## Scripts

| Script | Descricao |
|--------|-----------|
| `npm run build` | Build de todos os pacotes (shared primeiro) |
| `npm run build:shared` | Build apenas do pacote shared |
| `npm run dev:backend` | Backend em modo watch (tsx) |
| `npm run dev:frontend` | Frontend com Vite HMR |
| `npm run lint` | ESLint em todo o monorepo |
| `npm run format` | Prettier em todo o monorepo |
| `npm run typecheck` | tsc --noEmit em todos os pacotes |
| `npm test` | Todos os testes |
| `npm run db:migrate --workspace=@back-stage/backend` | Aplica migrations pendentes |
| `npm run db:migrate:rollback --workspace=@back-stage/backend` | Reverte ultimo batch |
| `npm run db:migrate:status --workspace=@back-stage/backend` | Status das migrations |
| `npm run db:seed --workspace=@back-stage/backend` | Executa seeds (idempotentes) |

---

## Historico de versoes

| Versao | Descricao |
|--------|-----------|
| 3.0 | Multi-cliente, formulario de servidores com abas (rede/discos/servicos), grafo ecossistema com formas distintas, auditoria com filtros e bulk delete, usuarios multi-select, sidebar com icones, protecao de exclusao de servidor com aplicacoes vinculadas |
| 2.0 | Modulo de servidores e aplicacoes completo (DDD backend + frontend React), grafo D3.js, ConfirmDialog, botao Duplicar, validacao de hostname |
| 1.0 | Foundation: auth JWT, service catalog, governance, search, audit, deployments, webhooks, observabilidade, CI/CD |
