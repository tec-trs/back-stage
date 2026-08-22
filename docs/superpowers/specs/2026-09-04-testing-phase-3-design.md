# Phase 3 Testing Strategy: Ecosystem Integration + E2E + Tier 2

**Back-Stage CMDB** — Validação End-to-End  
**Data**: 4 de Setembro de 2026  
**Status**: Especificação

---

## 1. Sumário Executivo

Phase 3 valida o módulo **Ecosystem** (Phase 2) através de testes end-to-end em workflows críticos de impacto. Integra o endpoint `/api/ecosystem/graph` ao frontend EcosystemPage, expande testes para módulos Tier 2 (search, urls), e alcança **50%+ cobertura global** com foco em funcionalidade crítica.

**Escopo**: Ecosystem (prioridade) + Tier 2 lightweight  
**Alvo de cobertura**: 50%+ global, validação de workflows críticos  
**Timeline**: 1,5 semanas (4-13 de Setembro de 2026)  
**Framework E2E**: Playwright (existente)

---

## 2. Contexto: O Que Valida Phase 3

### Phase 2 Entregou
- Módulo ecosystem com `/api/ecosystem/graph` endpoint
- 17 testes (9 unit + 8 integration em PostgreSQL)
- Mas: **módulo órfão no frontend** (EcosystemPage usa `/api/resource-graph`, não o novo endpoint)

### Phase 3 Missão
**Validar que o módulo ecosystem funciona de verdade** em cenários críticos:
1. Usuário cria relacionamento (servidor → app)
2. Sistema calcula impacto corretamente (app offline → recursos dependentes impactados)
3. Relacionamentos se refletem no grafo visual

**Por que é crítico**: Ecosystem é a **análise de impacto** — core da plataforma. E2E valida que backend + frontend + cálculo de impacto funcionam juntos.

---

## 3. Estratégia de Teste por Camada

### Layer 1: Frontend Hook Unit Tests

**Arquivo**: `packages/frontend/src/features/ecosystem/useEcosystemGraph.test.ts`

**Novo Hook**:
```typescript
export function useEcosystemGraph(filters?: EcosystemFilters) {
  return useQuery({
    queryKey: ['ecosystem-graph', filters],
    queryFn: () => apiRequest('/api/ecosystem/graph', { method: 'GET' }),
  });
}
```

**Testes** (3 testes):
1. **Hook retorna dados do endpoint**
   - Mock: apiRequest retorna `{ nodes: [...], edges: [...] }`
   - Assert: hook retorna mesma estrutura
   - Assert: queryKey correto para cache

2. **Hook lida com erro**
   - Mock: apiRequest lança erro
   - Assert: hook propagate erro corretamente
   - Assert: isError = true

3. **Hook carrega estado**
   - Mock: apiRequest com delay
   - Assert: isLoading = true enquanto carrega
   - Assert: isLoading = false após resolução

**Fixture**: Mock de apiRequest (vi.fn)

---

### Layer 2: EcosystemPage Component Tests

**Arquivo**: `packages/frontend/src/pages/EcosystemPage.test.tsx`

**Componentes Testados**:
- EcosystemPage (refatorado para usar `useEcosystemGraph`)
- ResourceGraph (renderização)
- ConnectionModal (criar relacionamento)

**Testes** (5 testes):
1. **Página carrega grafo do hook**
   - Mock: useEcosystemGraph retorna 5 nós, 3 arestas
   - Assert: ResourceGraph recebe dados corretos
   - Assert: nós aparecem no DOM

2. **Busca filtra nós**
   - Seed: 5 nós com labels distintos
   - Act: digitador em search input "servidor-1"
   - Assert: apenas servidor-1 destacado
   - Assert: outros nós não destacados

3. **Criar relacionamento (modal)**
   - Act: clica em edit mode, arrasta de nó A para nó B
   - Assert: ConnectionModal aparece com A → B
   - Assert: usuário pode inverter (⇄) se necessário
   - Assert: ao confirmar, chamada POST é feita

4. **Deletar relacionamento**
   - Act: clica em × em uma aresta
   - Assert: aresta removida do grafo
   - Assert: DELETE chamado ao backend

5. **Modo compacto persiste**
   - Act: ativa compact mode
   - Assert: localStorage salva estado
   - Act: recarrega página
   - Assert: compact mode ainda ativo

**Fixture**: Mock de useEcosystemGraph, dados realistas (servidor + 3 apps)

---

### Layer 3: E2E Tests — Workflows Críticos de Impacto

**Arquivo**: `e2e/tests/ecosystem-impact.spec.ts`

**Objetivo**: Validar que cálculo de impacto funciona end-to-end com dados realistas.

**Seed de Dados Realista** (via API antes de E2E):
```
Servidor: prod-db-01 (status: online)
  ↓ hosts
App A: user-service (status: online)
  ↓ dependsOn
  Database: postgres-main
  
App B: order-service (status: online)
  ↓ dependsOn
  App A (user-service)
  Database: postgres-cache

App C: api-gateway (status: online)
  ↓ dependsOn
  App B (order-service)
```

**Teste 1: Simular Impacto — Servidor Offline**
- Act: Abrir /ecosystem, selecionar prod-db-01, clicar "Simular impacto"
- Assert: Página recalcula e mostra impactados:
  - Profundidade 1: user-service (direto)
  - Profundidade 2: order-service (indireto via A)
  - Profundidade 3: api-gateway (indireto via B)
- Assert: Cores do grafo mudam (red/orange/amber por profundidade)
- Assert: Badge mostra "3 recursos impactados"

**Teste 2: Criar Relacionamento + Impacto Recalcula**
- Act: Edit mode ON, drag de order-service para nova dependency (vip-cache)
- Assert: Modal aparece, confirma relação "dependsOn"
- Assert: Grafo recalcula, nova aresta visível
- Act: Simula impacto novamente
- Assert: vip-cache agora incluído nos impactados

**Teste 3: Deletar Relacionamento + Impacto Muda**
- Act: Clica em × em aresta "order-service → user-service"
- Assert: Aresta removida do grafo
- Act: Simula impacto de api-gateway
- Assert: Profundidade muda (user-service já não impactado via order-service)

**Teste 4: Exportar Grafo (PNG/PDF)**
- Act: Clica "Exportar → PNG"
- Assert: Download inicia corretamente
- Assert: Arquivo contém grafo renderizado

**Teste 5: Ciclo de Dependência (Edge Case)**
- Seed: A → B → C → A (ciclo)
- Act: Simula impacto de A
- Assert: Sistema não trava
- Assert: Detecção de ciclo retorna corretamente (hasCycle = true)
- Assert: Grafo mostra ciclo com indicador visual

---

### Layer 4: Tier 2 Lightweight Unit Tests

**Search Module** (`packages/backend/src/modules/search/search.service.test.ts`)

**Testes** (3 testes):
1. **Search retorna recursos matchados**
   - Seed: 10 recursos (servidores, apps, bancos)
   - Act: search.search("postgres")
   - Assert: retorna apenas recursos com "postgres" no nome/descrição

2. **Search com tipos de recurso**
   - Act: search.search("svc", { resourceTypes: ["application"] })
   - Assert: retorna apenas aplicações
   - Assert: ignora servidores/bancos com "svc" no nome

3. **Search vazio**
   - Act: search.search("")
   - Assert: retorna lista vazia (não error)

**URLs Module** (`packages/backend/src/modules/urls/url.service.test.ts`)

**Testes** (3 testes):
1. **URL validation**
   - Assert: URL válida passa
   - Assert: URL inválida falha

2. **Health check status**
   - Mock: health check retorna 200
   - Assert: url.status = 'healthy'
   - Mock: health check retorna 500
   - Assert: url.status = 'unhealthy'

3. **URL criação com validação**
   - Act: url.create({ url: "https://example.com" })
   - Assert: URL criada
   - Assert: primeira verificação de saúde agendada

---

## 4. Dados de Teste E2E (Realistas)

### Cenário 1: Infraestrutura Simples
```
prod-db-01 (server)
├─ hosts ─→ user-service (app)
│          ├─ dependsOn ─→ postgres-main (database)
│          └─ dependsOn ─→ redis-cache (database)
├─ hosts ─→ order-service (app)
│          └─ dependsOn ─→ user-service (app)
└─ hosts ─→ api-gateway (app)
           └─ dependsOn ─→ order-service (app)
```

**Impacto Esperado** (server offline):
- Nível 1: user-service, order-service, api-gateway (3 apps)
- Nível 2: postgres-main, redis-cache (2 bancos)

### Cenário 2: Com VIP + URL
```
api-gateway (app)
├─ exposes ─→ api.example.com (url)
└─ dependsOn ─→ vip-balancer (vip)
                └─ dependsOn ─→ user-service (app)
```

**Impacto Esperado** (api-gateway offline):
- Nível 1: vip-balancer, api.example.com (VIP+URL)
- Nível 2: user-service (app)

---

## 5. Alterações de Código

### Frontend

**Novos Arquivos**:
- `packages/frontend/src/features/ecosystem/useEcosystemGraph.ts`
- `packages/frontend/src/features/ecosystem/types.ts`
- `packages/frontend/src/features/ecosystem/useEcosystemGraph.test.ts`

**Arquivos Modificados**:
- `packages/frontend/src/pages/EcosystemPage.tsx` (refactor: trocar `useFullGraph` → `useEcosystemGraph`)
- `packages/frontend/src/pages/EcosystemPage.test.tsx` (novo arquivo com 5 testes)

**Alinhamento de Tipos**:
- Validar que `EcosystemGraphResponse` (backend Phase 2) == interface esperada por EcosystemPage
- Se desalinhamento: adaptar no frontend (converter resposta) em vez de alterar backend

### Backend

**Sem mudanças** — Phase 2 ecosystem module já está pronto.
- Apenas validar que `/api/ecosystem/graph` retorna dados corretos para E2E

### E2E

**Novo Arquivo**:
- `e2e/tests/ecosystem-impact.spec.ts` (5 testes Playwright)

**Configuração Existente**:
- `e2e/playwright.config.ts` (já configurado em Phase 2, reutilizar)

---

## 6. Critérios de Sucesso

### Cobertura
- Frontend ecosystem hooks: 100% (todos os paths)
- EcosystemPage component: 80%+ (UI rendering)
- Ecosystem service (backend): 100% (já em Phase 2)
- Ecosystem repository (backend): 100% (já em Phase 2)
- Search service: 80%+ unit tests
- URLs service: 80%+ unit tests

**Cobertura Global**: 50%+ (de ~30% Phase 2)

### Funcionalidade E2E
- ✅ Criar relacionamento funciona end-to-end
- ✅ Simular impacto calcula corretamente (incluindo indiretos)
- ✅ Deletar relacionamento reflete no grafo
- ✅ Ciclo de dependência tratado corretamente
- ✅ Exportação funciona
- ✅ Sem erros de console durante workflows

### Qualidade
- ✅ Todos os 13 testes E2E + unit passando
- ✅ Sem testes skipped ou .only()
- ✅ TypeScript strict mode
- ✅ ESLint passing
- ✅ Sem console.log em testes

### Documentação
- ✅ Test files incluem clear describe/it labels
- ✅ E2E test setup documentado em TESTING-PHASE-3-RESULTS.md
- ✅ Hook interface documentado (JSDoc)

---

## 7. Timeline & Milestones

**Semana 1 (4-8 de Setembro)**

| Dia | Milestone | Output |
|-----|-----------|--------|
| Qua-Qui | Hook + Component tests | 8 testes passando (unit) |
| Qui-Sex | E2E test base (Playwright) | 2-3 E2E testes, estáveis |
| Sex-Seg | Tier 2 unit tests (search/urls) | 6 testes Tier 2 |

**Semana 2 (9-13 de Setembro)**

| Dia | Milestone | Output |
|-----|-----------|--------|
| Seg-Ter | E2E edge cases (ciclos, deletes) | 5 E2E tests completos |
| Ter-Qua | Polish + coverage report | Final report |
| Qua | Merge para main | Tudo integrado |

**Entregáveis**:
1. 8 unit tests (frontend hooks + component)
2. 5 E2E tests (workflows críticos de impacto)
3. 6 Tier 2 unit tests (search/urls)
4. **Total: 19 testes** (vs. 17 de Phase 2)
5. `TESTING-PHASE-3-RESULTS.md` com cobertura e findings
6. Documentação de setup E2E

---

## 8. Constraints Globais (From Phase 2)

### Padrões de Teste
- TypeScript strict mode habilitado
- ESLint compliance obrigatório
- Sem dados hardcoded (todos factory-based)
- Testes isolados: sem estado compartilhado entre suites

### CI/CD
- Ubuntu Linux (GitHub Actions)
- PostgreSQL 16 service disponível
- Node.js 20, npm latest
- Testes rodam em push para main/develop e PRs

### Code Quality
- Sem console.log em testes
- Sem skip(), only(), .todo() em commits
- Coverage thresholds: failure se abaixo do target
- Fixtures Phase 1 reutilizadas (db-connection, seed-data, mock-factories)

---

## 9. Decisões Arquiteturais

### Refactor Mínimo vs. Perfeito
**Decisão**: Refactor **mínimo** para EcosystemPage
- Substitui `useFullGraph()` → `useEcosystemGraph()` (uma linha)
- Se houver mismatch de formato de dados: **adaptar no frontend** (converter resposta) em vez de alterar backend Phase 2
- Justificativa: Validar que ecosystem funciona importa mais que refactor perfeito; Phase 2 já entregou; risco baixo de adaptar que fazer grandes mudanças

### E2E Data Fixtures
**Decisão**: Seed realística via API (não factories Phase 1)
- Phase 1 factories são para unit tests rápidos
- E2E precisa de dados que **demonstrem impacto real** (servidor → múltiplos apps → recursos dependentes)
- Usar API de criação (POST /servers, /applications, etc.) antes de E2E test começar

### Tier 2 Lightweight
**Decisão**: Apenas unit tests para search/urls
- Integration tests para Tier 2 ficam para Phase 4
- Justificativa: Ecosystem impacto validado; Tier 2 precisa de menos validação agora; 1.5 semanas é apertado

---

## 10. Phase 4 Preview

Phase 4 (Outubro):
- Expandir search/urls para integration + E2E tests
- Adicionar frontend component tests para search/urls UI
- Target: 60%+ cobertura global
- Possível integração de mais módulos Tier 2 (catalog, governance)

---

**Status do Documento**: Pronto para aprovação  
**Próximo Passo**: Usuário aprova → Criar plano de implementação via writing-plans skill

