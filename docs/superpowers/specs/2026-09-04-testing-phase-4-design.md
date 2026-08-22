# Phase 4 Testing Strategy: Tier 2 Completion + EcosystemPage Investigation

**Back-Stage CMDB** — Blocker Resolution & Coverage Expansion  
**Data**: 4 de Setembro de 2026  
**Status**: Especificação

---

## 1. Sumário Executivo

Phase 4 completa a cobertura de testes para **50%+ global** através de duas tracks paralelas:

1. **Investigation Track** (1-2 semanas): Diagnosticar e propor solução para blocker de EcosystemPage unit tests (worker crash on component render)
2. **Tier 2 Track** (3+ semanas): Completar search + urls com testes de integration + E2E

**Resultado:** 40+ testes totais (Phase 3: 19 + Phase 4: 21+), EcosystemPage remediado, 50%+ cobertura global.

**Timeline**: 4+ semanas (Setembro-Outubro 2026)  
**Parallelismo**: Investigação async, Tier 2 executa em paralelo

---

## 2. Contexto: O Que Phase 4 Herda

### Phase 3 Deliverables
- ✅ 19 testes (3 hook unit + 5 component + 5 E2E + 6 Tier 2 unit)
- ✅ Ecosystem integrado ao frontend (useEcosystemGraph hook)
- ✅ CI/CD estável com PostgreSQL
- ✅ Vitest, Jest, Playwright frameworks operacionais

### Phase 3 Issues Parked
- 📋 **Task 5 Blocker**: EcosystemPage component unit tests crash com "Worker exited unexpectedly"
  - Ocorre em: `render(<EcosystemPage />)` com QueryClientProvider wrapper
  - Root cause desconhecida: memory? circular imports? DOM complexity?
  - Workaround: E2E tests validam funcionalidade, unit tests parked
  - **Phase 4 Mission**: Investigar + resolver

### Tier 2 Status
- ✅ Search: 3 unit tests (service layer)
- ✅ URLs: 3 unit tests (service layer)
- ❌ Search: Faltam integration + E2E
- ❌ URLs: Faltam integration + E2E

---

## 3. Estratégia: Parallel Execution

### Timeline Overview

```
Phase 4: 4+ weeks (Sep 4 - Oct 4+)

Week 1-2: Investigation + Tier 2 Base
├─ Investigation: EcosystemPage root cause (subagent, 1-2 weeks)
│  └─ Diagnose: memory? imports? DOM?
│  └─ Propose: 2-3 solutions with trade-offs
│
└─ Main Track: Tier 2 Search
   ├─ 3 integration tests (database, real PostgreSQL)
   └─ 1-2 E2E tests (browser, workflows)

Week 2-3: Tier 2 Expansion + Decision
├─ 3 URL integration tests
├─ 3 Search E2E tests (complete)
└─ Review investigation findings → decide EcosystemPage path

Week 3-4: EcosystemPage Remediation + Tier 2 Complete
├─ Implement EcosystemPage solution
├─ EcosystemPage component tests (updated approach)
└─ 3 URL E2E tests

Week 4+: Polish & Coverage Validation
├─ Final tests, documentation
└─ 50%+ global coverage verified
```

### Why Parallel?
- Investigation pode ser longa e incerta — não bloqueia Tier 2
- Tier 2 é straightforward — executa independentemente
- By week 2-3, temos dados para decisão de EcosystemPage
- Aproveita timeline (4 semanas) sem desperdício

---

## 4. Track 1: Investigation (EcosystemPage Blocker)

### Problema (Phase 3 Task 5)

**Sintoma:**
```
Error: Worker exited unexpectedly
  at ChildProcess.onUnexpectedExit (tinypool/dist/index.js:118:30)
```

**Context:**
- Ocorre ao executar: `render(<EcosystemPage />, { wrapper: QueryClientProvider })`
- Vitest worker crashes (não é erro de teste, é crash de processo)
- Ocorre com: default memory, 8GB alocada, com/sem mocks
- Tested: diferentes mocking strategies, lazy loading, sem resultado

### Investigação Esperada (1-2 weeks)

**Root Cause Analysis:**
1. **Memory Hypothesis**: EcosystemPage renderiza grafo com D3/Vis library?
   - ResourceGraph component carrega dependências pesadas?
   - JSDOM dom-to-image?

2. **Import Hypothesis**: Circular imports ao renderizar?
   - EcosystemPage → features → hooks → modules → circle?
   - Vitest detecta ciclo?

3. **Component Hypothesis**: DOM complexity exceeds test environment?
   - 50+ nodes renderizados = muita memória em JSDOM?
   - Límite do Vitest worker?

4. **Framework Hypothesis**: Conflito entre React Query + BrowserRouter + mocks?
   - Wrapper nesting issue?

**Deliverables:**
- Diagnosis: Qual é a raiz
- 2-3 Proposed Solutions com trade-offs:
  - **Option A**: Lazy-load ResourceGraph (component render on demand)
  - **Option B**: Mock graph library completely (no real DOM)
  - **Option C**: Skip unit tests, rely on E2E + integration tests

- Cost-Benefit para cada opção
- Recomendação

### Implementação (Week 3-4, if approved)
- Executar solução escolhida
- Adicionar component tests (approach atualizado)
- Validar com full test suite

---

## 5. Track 2: Tier 2 Completion (Search + URLs)

### Search Module

**Integration Tests (3 tests, Week 1-2):**
1. **Fetches + filters resources**
   - Seed: 10 recursos (servers, apps, bancos)
   - Act: search.search("postgres", { resourceTypes: ["database"] })
   - Assert: retorna apenas bancos com "postgres" no nome

2. **Pagination handling**
   - Seed: 100 recursos
   - Act: search.search("app", { page: 1, pageSize: 10 })
   - Assert: retorna página 1 (10 items), pagination data correto

3. **Soft-delete filtering**
   - Seed: 5 recursos (3 ativos, 2 soft-deleted)
   - Act: search.search("app")
   - Assert: retorna apenas ativos (soft-deleted excluídos)

**E2E Tests (3 tests, Week 2-3):**
1. **Global search from header**
   - Act: Type "postgres" in search bar
   - Assert: Results page shows matching resources

2. **Filter results by type**
   - Act: Select "Applications" filter
   - Assert: Only apps in results

3. **Navigate to resource detail**
   - Act: Click resource in search results
   - Assert: Navigate to detail page (servers, apps, databases, urls)

---

### URLs Module

**Integration Tests (3 tests, Week 2-3):**
1. **Health check status updates**
   - Seed: URL com status inicial "unknown"
   - Act: url.checkHealth()
   - Assert: status atualizado (healthy/unhealthy)

2. **URL validation**
   - Act: url.create({ url: "invalid" })
   - Assert: Validation error
   - Act: url.create({ url: "https://example.com" })
   - Assert: URL criado

3. **Lifecycle: create, update, delete**
   - Test full CRUD cycle com validações

**E2E Tests (3 tests, Week 3-4):**
1. **Create URL from UI**
   - Act: Click "Create URL", fill form, submit
   - Assert: URL appears in list

2. **Monitor health status changes**
   - Act: View URL detail, trigger health check
   - Assert: Status updates in real-time

3. **Export URL list**
   - Act: Click "Export URLs"
   - Assert: Download CSV/JSON with all URLs

---

## 6. Coverage Goals & Success Criteria

### Coverage Targets

| Category | Phase 3 | Phase 4 Target | Método |
|----------|---------|----------------|--------|
| **Global** | 40-45% | 50%+ | Tier 2 (12 testes) + EcosystemPage |
| **Search** | 80% unit | 85%+ | 3 int + 3 E2E |
| **URLs** | 80% unit | 85%+ | 3 int + 3 E2E |
| **EcosystemPage** | Parked | 70%+ | Component tests (updated) |

### Success Criteria

✅ **Test Count**: 40+ total (19 Phase 3 + 21+ Phase 4)  
✅ **Coverage**: 50%+ global (CI/CD validated)  
✅ **EcosystemPage**: Blocker investigado + solução implementada  
✅ **Tier 2**: Search + URLs com unit + integration + E2E  
✅ **Code Quality**: All tests passing, TypeScript strict, ESLint clean  
✅ **Documentation**: TESTING-PHASE-4-RESULTS.md, Phase 5 preview

---

## 7. Constraints Globais (From Phase 3)

- TypeScript strict mode habilitado
- ESLint compliance obrigatório
- Sem dados hardcoded (todas as fixtures via factories)
- Testes isolados (sem shared state)
- CI/CD: Ubuntu Linux, PostgreSQL 16, Node.js 20
- Sem console.log em testes
- Coverage thresholds: 50%+ global, 80%+ per module

---

## 8. Phase 5 Preview

Phase 5 (Novembro+):
- **Catalog + Governance modules**: Integration + E2E tests
- **Frontend component library**: Hook tests, snapshots
- **Target**: 60%+ global coverage
- **EcosystemPage**: Fully tested (both unit + integration)

---

**Status do Documento**: Pronto para aprovação  
**Próximo Passo**: Você aprova → Criar plano de implementação via writing-plans skill
