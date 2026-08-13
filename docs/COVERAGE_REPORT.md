# Relatorio de Cobertura de Testes

Gerado localmente em 2026-08-13, executando `npm run test:coverage` em `packages/backend` e `packages/frontend`, mais a suite de integracao (`packages/backend`, Jest+Supertest) e a suite E2E (`packages/e2e`, Playwright).

## Resumo executivo

| Suite | Ferramenta | Testes | Status |
| --- | --- | --- | --- |
| Backend — unidade | Vitest | 38 | ✅ 100% passando |
| Backend — integracao HTTP | Jest + Supertest | 12 | ✅ 100% passando |
| Frontend — componentes/paginas | Vitest + React Testing Library | 17 | ✅ 100% passando |
| E2E | Playwright (Chromium) | 5 | ✅ 100% passando |
| **Total** | | **72** | **✅ 100% passando** |

## Cobertura de linhas medida (Vitest --coverage, provider v8)

| Pacote | Statements | Branches | Functions | Lines |
| --- | --- | --- | --- | --- |
| `packages/backend` | 24.86% | 76.79% | 67.93% | 24.86% |
| `packages/frontend` | 44.74% | 71.05% | 49.33% | 44.74% |

**Meta do checklist (80%+): nao atingida na cobertura agregada de linhas nesta execucao local.** Justificativa detalhada abaixo — a causa raiz e estrutural (ausencia de PostgreSQL neste ambiente de execucao), nao ausencia de testes escritos.

## Por que a cobertura agregada esta abaixo de 80%

A suite de testes foi desenhada em camadas, seguindo Repository Pattern + Service Layer:

1. **Domain / Application (regras de negocio)** — testados via Vitest com repositorios mockados. Cobertura tipicamente **80-100%** nesta camada: `PolicyEngine` (100%), `policy-definition` (87%), `ServiceService`, `PolicyService`, `DeploymentService`, `DeploymentTrackingService`, parsers de webhook GitHub/GitLab (100%), verificacao de assinatura HMAC (100%), query builder de busca full-text (100%).
2. **Interfaces HTTP (rotas/controllers/validacao)** — cobertos pela suite Jest+Supertest, que exercita o `Express app` real (headers de seguranca, request-id, RBAC, validacao Zod, roteamento, 404, OpenAPI, `/metrics`). Essa suite tem sua propria cobertura (nao somada ao numero do Vitest acima, pois sao ferramentas/execucoes distintas).
3. **Infrastructure (repositories Knex)** — **0% de cobertura de linha** nesta execucao. Estes modulos fazem queries reais contra PostgreSQL; **este ambiente sandboxed nao possui Docker/PostgreSQL disponivel** (limitacao documentada desde a Fase 2), entao nenhum teste consegue exercitar `*.repository.ts` de fato. Isso arrasta a media agregada de "Statements"/"Lines" para baixo, mesmo com a camada de negocio bem coberta.
4. **Migrations/seeds/bootstrap** (`index.ts`, `server.ts`, `tracing.ts`, arquivos de config) — excluidos propositalmente da cobertura (ver `vitest.config.ts`), pois sao scripts de bootstrap/infra sem logica de decisao a testar.

O mesmo padrao se repete no frontend: paginas com dados 100% locais (`SettingsPage`) ou com API mockada (`LoginPage`, `CatalogPage`, `GovernancePage`) tem cobertura alta; paginas restantes (`DashboardPage`, `InfrastructurePage`, `AuditPage`, `ServiceDetailPage`) e hooks de dados (`use-*.ts`) ainda nao tem teste dedicado.

## Caminho para 80%+ (proximos passos concretos)

1. Adicionar um servico `postgres` no job de CI (`backend-integration-tests`), rodar `db:migrate` + `db:seed`, e estender `app.integration.test.ts` com fluxos completos de CRUD (create → get → update → delete) por modulo. Isso sozinho deve levar a cobertura de `infrastructure/*.repository.ts` e `interfaces/http/*.controller.ts` de 0% para 80%+.
2. Completar os testes de pagina do frontend faltantes (`DashboardPage`, `InfrastructurePage`, `AuditPage`, `ServiceDetailPage`, `DependencyGraph`) seguindo o padrao ja estabelecido (mock de `apiRequest` + RTL).
3. Expandir o E2E (`packages/e2e`) para um fluxo de login bem-sucedido de ponta a ponta assim que houver um Postgres seedado disponivel no pipeline.

## Como reproduzir

```bash
npm run test:coverage --workspace=@back-stage/backend    # Vitest (unidade) + cobertura
npm run test:integration --workspace=@back-stage/backend # Jest + Supertest
npm run test:coverage --workspace=@back-stage/frontend   # Vitest + RTL + cobertura
npm run test:e2e --workspace=@back-stage/e2e              # Playwright (requer `npx playwright install`)
```

Relatorios HTML gerados em `packages/backend/coverage/index.html` e `packages/frontend/coverage/index.html`.
