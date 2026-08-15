# Platform Engineering Center

Plataforma corporativa de engenharia de plataforma inspirada no Backstage / Spotify Portal Engineering e nos princípios da CNCF. Permite catalogar serviços, documentar infraestrutura, rastrear implantações, aplicar políticas de governança e mapear dependências do ecossistema — tudo em uma interface única para times de engenharia.

---

## Estrutura do repositório

```
back-stage/
├── packages/
│   ├── backend/      Node.js + Express + TypeScript (API REST)
│   ├── frontend/     React 19 + Vite + TailwindCSS (SPA)
│   ├── shared/       Tipos e utilitários compartilhados
│   └── cli/          CLI para operações administrativas
├── docker-compose.yml
└── package.json      (npm workspaces)
```

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|--------------|
| Node.js    | 20           |
| npm        | 10           |
| PostgreSQL  | 16           |
| Docker     | 24 (opcional) |

---

## Configuração inicial

### 1. Instalar dependências

```bash
npm install
```

### 2. Banco de dados

Suba o PostgreSQL via Docker:

```bash
docker compose up -d postgres
```

Ou configure manualmente e ajuste as variáveis de ambiente abaixo.

### 3. Variáveis de ambiente

Crie `packages/backend/.env` com base no exemplo:

```env
# Banco de dados
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/backstage

# JWT
JWT_SECRET=troque-em-producao
JWT_EXPIRES_IN=8h

# Servidor
PORT=4000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5200

# Rate limit
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200
```

### 4. Migrations e seed

```bash
# Rodar todas as migrations
npm run db:migrate --workspace=@back-stage/backend

# Popular dados iniciais (admin, tipos padrão, etc.)
npm run db:seed --workspace=@back-stage/backend
```

O seed cria:
- Usuário admin (`admin` / `Tectrs123`)
- Tipos de máquina padrão: `vm`, `bare_metal`, `container_host`
- Tipos de aplicação padrão: `web_app`, `api_backend`, `mobile`, `batch_job`, `microservice`, `monolith`, `internal_library`, `middleware`

---

## Executar em desenvolvimento

```bash
# Backend (porta 4000)
npm run dev:backend

# Frontend (porta 5200)
npm run dev:frontend
```

Abra `http://localhost:5200` no navegador.

---

## Scripts disponíveis

### Raiz (todos os workspaces)

| Comando | Descrição |
|---------|-----------|
| `npm run build` | Compila todos os pacotes |
| `npm run typecheck` | TypeScript sem emissão em todos os pacotes |
| `npm run lint` | ESLint em todo o repositório |
| `npm run format` | Prettier nos fontes |
| `npm test` | Testes de todos os pacotes |

### Backend (`--workspace=@back-stage/backend`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia com `tsx watch` |
| `npm run build` | Compila para `dist/` |
| `npm run test` | Vitest (unit) |
| `npm run test:coverage` | Cobertura via v8 |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:migrate:rollback` | Desfaz o último batch |
| `npm run db:migrate:status` | Lista status das migrations |
| `npm run db:seed` | Executa todos os seeds |

### Frontend (`--workspace=@back-stage/frontend`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Vite dev server (porta 5200) |
| `npm run build` | Bundle de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run preview` | Preview do build |

---

## API REST

Base URL: `http://localhost:4000/api`

Documentação interativa (Swagger): `http://localhost:4000/api/docs`

Métricas Prometheus: `http://localhost:4000/metrics`

### Endpoints disponíveis

| Prefixo | Módulo | Descrição |
|---------|--------|-----------|
| `GET /api/health` | Health | Status da API |
| `POST /api/auth/login` | Auth | Login + JWT |
| `POST /api/auth/refresh` | Auth | Refresh token |
| `GET/POST /api/users` | Usuários | CRUD de usuários |
| `GET/POST /api/teams` | Times | CRUD de times |
| `POST /api/teams/:id/members` | Times | Adicionar membro |
| `DELETE /api/teams/:id/members/:userId` | Times | Remover membro |
| `PATCH /api/teams/:id/members/:userId` | Times | Alterar papel |
| `GET/POST /api/environments` | Ambientes | CRUD de ambientes |
| `GET/POST /api/server-types` | Tipos de Máquina | CRUD de tipos |
| `GET/POST /api/application-types` | Tipos de Aplicação | CRUD de tipos |
| `GET/POST /api/servers` | Servidores | CRUD de servidores |
| `GET/POST /api/applications` | Aplicações | CRUD de aplicações |
| `GET /api/ecosystem` | Ecossistema | Grafo de dependências |
| `GET/POST /api/services` | Service Catalog | CRUD do catálogo |
| `GET/POST /api/catalog-entities` | Catálogo | Entidades genéricas |
| `GET/POST /api/governance` | Governança | Políticas e avaliações |
| `GET/POST /api/audit-logs` | Auditoria | Trilha de auditoria |
| `GET/POST /api/deployments` | Implantações | Rastreamento de deploys |
| `GET /api/search` | Busca | Full-text search (PostgreSQL) |

Todos os endpoints protegidos exigem `Authorization: Bearer <token>`.

---

## Controle de acesso (RBAC)

| Role | Capacidades |
|------|-------------|
| `admin` | Acesso total; único que pode criar/excluir usuários e times |
| `maintainer` | Criar e editar recursos; não pode excluir usuários |
| `viewer` | Somente leitura |

---

## Banco de dados

O esquema possui 27 migrations aplicadas em ordem sequencial.

### Principais tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários com bcrypt + JWT |
| `teams` | Times de trabalho |
| `team_members` | Relação usuário ↔ time com papel (`owner`, `member`) |
| `environments` | Ambientes (ex.: produção, staging) |
| `server_types` | Tipos de máquina (slug dinâmico, substituiu enum fixo) |
| `application_types` | Tipos de aplicação (slug dinâmico) |
| `servers` | Inventário de servidores com discos |
| `server_disks` | Discos de servidores (1:N) |
| `applications` | Catálogo de aplicações |
| `application_deployments` | Histórico de implantações |
| `application_dependencies` | Grafo de dependências entre aplicações |
| `catalog_entities` | Entidades genéricas do catálogo de serviços |
| `governance_policies` | Políticas de conformidade |
| `governance_policy_evaluations` | Resultado de avaliações de políticas |
| `governance_policy_exemptions` | Isenções de políticas |
| `compliance_checks` | Verificações de conformidade |
| `compliance_findings` | Achados de conformidade |
| `audit_logs` | Trilha de auditoria imutável |
| `deployments` | Rastreamento de deploys (GitHub Actions, GitLab CI) |

Todas as tabelas usam:
- UUID como chave primária (via `pgcrypto`)
- `created_at`, `updated_at` (trigger automático) e `deleted_at` (soft delete)
- Índices parciais `WHERE deleted_at IS NULL` nas colunas de unicidade

---

## Frontend — Páginas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/login` | Login | Autenticação |
| `/` | Painel | Dashboard com métricas resumidas |
| `/catalog` | Catálogo | Catálogo de serviços |
| `/catalog/:id` | Detalhe do Serviço | Documentação + grafo de dependências |
| `/infrastructure` | Infraestrutura | Visão geral da infraestrutura |
| `/servers` | Servidores | Inventário de servidores |
| `/servers/:id` | Detalhe do Servidor | Detalhamento com discos e aplicações |
| `/applications` | Aplicações | Catálogo de aplicações |
| `/applications/:id` | Detalhe da Aplicação | Detalhamento com implantações e dependências |
| `/ecosystem` | Ecossistema | Grafo interativo de dependências (D3.js) |
| `/users` | Usuários | Gestão de usuários *(admin)* |
| `/teams` | Times | Gestão de times e membros |
| `/environments` | Ambientes | Cadastro de ambientes |
| `/server-types` | Tipos de Máquina | Registro dinâmico de tipos |
| `/application-types` | Tipos de Aplicação | Registro dinâmico de tipos |
| `/audit` | Auditoria | Trilha de auditoria |
| `/governance` | Governança | Políticas de conformidade |
| `/settings` | Configurações | Configurações da plataforma |

### Menu lateral — Governança

O grupo **Governança** no menu lateral agrupa os cadastros de referência:

- Usuários (admin only)
- Times
- Ambientes
- Tipos de Máquina
- Tipos de Aplicação
- Auditoria

---

## Arquitetura do backend

```
packages/backend/src/
├── modules/
│   └── <modulo>/
│       ├── domain/           Entidades e interfaces de repositório
│       ├── application/      Services (casos de uso)
│       ├── infrastructure/   Repositórios Knex
│       └── interfaces/http/  Controllers, rotas e validação Zod
├── shared/
│   ├── http/                 Middlewares globais (auth, erros, métricas)
│   └── logger/               Winston
├── database/
│   ├── connection.ts
│   ├── migrations/
│   └── seeds/
├── config/env.ts
├── docs/openapi.ts
├── observability/            OpenTelemetry + Prometheus
└── app.ts
```

Cada módulo é registrado via factory `registerXxxModule(): Router` que constrói a cadeia de dependências: Repositório → Service → Controller → Router.

---

## Observabilidade

| Componente | Endpoint / porta |
|------------|-----------------|
| Prometheus (métricas) | `GET /metrics` |
| Swagger (OpenAPI) | `GET /api/docs` |
| Winston logs | `stdout` (JSON em produção) |
| OpenTelemetry | Exporta para OTLP HTTP |

Métricas coletadas: contagem de requests, latência por rota, erros por status code.

---

## Testes

```bash
# Todos os pacotes
npm test

# Backend — unit (Vitest)
npm run test --workspace=@back-stage/backend

# Backend — cobertura
npm run test:coverage --workspace=@back-stage/backend

# Frontend — unit (Vitest)
npm run test --workspace=@back-stage/frontend
```

---

## Docker Compose

```bash
# Subir apenas o banco
docker compose up -d postgres

# Subir tudo (banco + backend + frontend)
docker compose up
```

---

## Variáveis de ambiente — referência completa

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `DATABASE_URL` | — | Connection string do PostgreSQL |
| `JWT_SECRET` | — | Chave de assinatura JWT (obrigatória) |
| `JWT_EXPIRES_IN` | `8h` | Validade do access token |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Validade do refresh token |
| `PORT` | `4000` | Porta do servidor backend |
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `CORS_ORIGIN` | `http://localhost:5200` | Origem permitida pelo CORS |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Janela do rate limiter (ms) |
| `RATE_LIMIT_MAX` | `200` | Máximo de requests por janela |
| `LOG_LEVEL` | `info` | Nível de log Winston |
| `VITE_API_URL` | `http://localhost:4000` | URL base da API (frontend) |
