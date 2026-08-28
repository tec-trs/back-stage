# Feature: CMDB Unificado com Análise de Impacto

## Visão Geral

Implementação de uma ferramenta unificada de CMDB (Configuration Management Database) que documenta servidores, aplicações, bancos de dados, URLs e todas as suas dependências em uma única interface. A ferramenta permite:

- Documentação estruturada de servidores (com recursos), aplicações, serviços, URLs e bancos de dados
- Visualização gráfica de dependências (individuais e gerais) com drill-down entre níveis
- Busca global por nomes, tags e atributos
- Simulação de paradas de recursos mostrando impacto transitivo (blast radius)

## Arquitetura

### Modelo de Dados

#### Novas Tabelas

1. **database_engines** — Referência dinâmica (postgres, mysql, mariadb, mongodb, redis, oracle, sqlserver, elasticsearch, cassandra, dynamodb)
2. **databases** — Primeira classe, atributos ricos (engine, version, port, criticality, environment, tags, monitoring_url, etc.)
3. **url_types** — Referência dinâmica (public, internal, api, webhook, admin_panel, documentation)
4. **urls** — Primeira classe com proprietário polimórfico (server|application|database), healthcheck status
5. **resource_relationships** — Grafo unificado polimórfico (source_type, source_id, target_type, target_id, relation_type)
   - relation_type: `hosts`, `depends_on`, `connects_to`, `exposes`, `consumes`, `part_of`
   - CHECK constraints para anti-self-loop e tipos válidos
   - Índices compostos em (source_type, source_id), (target_type, target_id) para performance

#### Extensões de Tabelas Existentes

- **servers, applications, databases, urls** — Adicionado coluna `search_vector` (tsvector GENERATED STORED) para busca full-text
- **applications** — Adicionado coluna `tags text[]` para paridade com servers
- **todas as 4 tabelas** — Adicionados índices GIN em `tags` para filtro eficiente

#### Migrations

```
20260101000027: create_database_engines_table
20260101000028: create_databases_table
20260101000029: create_url_types_table
20260101000030: create_urls_table
20260101000031: create_resource_relationships_table
20260101000032: migrate_legacy_relations_to_resource_relationships
20260101000033: add_tags_to_applications
20260101000034: add_gin_index_on_tags
20260101000035: add_search_vector_to_databases
20260101000036: add_search_vector_to_urls
20260101000037: add_search_vector_to_servers
20260101000038: add_search_vector_to_applications
```

### Backend

#### Módulos

##### `packages/backend/src/modules/databases/`
- **Entity**: `Database` com construtor tipado
- **Repository**: `IDatabaseRepository` com métodos `findMany()`, `findById()`, `create()`, `update()`, `setStatus()`, `softDelete()`
  - Suporta filtro por status, criticality, engine, environment, tags, search
- **Service**: `DatabaseService` com auditoria de mudanças
- **Controller**: CRUD endpoints + status management
- **Validation**: Schemas Zod para criação/atualização

##### `packages/backend/src/modules/urls/`
- Estrutura idêntica a databases
- **Validação especial**: `validateOwnerResourceExists()` para garantir integridade referencial do proprietário polimórfico

##### `packages/backend/src/modules/resource-graph/`
- **Repository**: `ResourceRelationshipRepository` com:
  - `getFullGraph(filters, pagination)` — Retorna nodes e edges de todas as 4 fontes, com limite rígido de 500 nós
  - `getSubgraph(rootType, rootId, depth)` — CTE recursiva com ciclo-detection via array `path`
  - `getTransitiveImpact(rootType, rootId)` — CTE recursiva para blast radius, agrupa por profundidade e tipo
  - `createRelationship()`, `deleteRelationship()` — Gerenciamento manual de arestas
- **Service**: `GraphService` que encapsula repositório
- **Controller**: Endpoints para grafo, simulação e relacionamentos
- **Types**: `ResourceType`, `RelationType`, `GraphNode`, `GraphEdge`, `ImpactResult`

##### `packages/backend/src/modules/search/`
- **Repository**: `SearchRepository` com:
  - `search()` — Full-text busca em `catalog_entities` (existente)
  - `unifiedSearch(query, tags?, pagination)` — **NOVO** — UNION ALL de servers, applications, databases, urls, catalog_entities
    - Filtra por `search_vector @@ to_tsquery()` + opcional `tags && ARRAY[...]`
    - Retorna `UnifiedSearchResultRow` com resourceType, label, description, environment, status
- **Service**: `SearchService` com método `unifiedSearch()`
- **Controller**: Endpoint `GET /api/search/unified-search?q=&tags=&page=&pageSize=`

#### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/databases` | Listar com filtros (status, env, tags, search) |
| GET | `/api/databases/:id` | Detalhe |
| POST | `/api/databases` | Criar |
| PUT | `/api/databases/:id` | Atualizar |
| DELETE | `/api/databases/:id` | Soft-delete |
| GET | `/api/urls` | Listar com filtros |
| GET | `/api/urls/:id` | Detalhe |
| POST | `/api/urls` | Criar |
| PUT | `/api/urls/:id` | Atualizar |
| DELETE | `/api/urls/:id` | Soft-delete |
| GET | `/api/resource-graph` | Grafo completo filtrado |
| GET | `/api/resource-graph/:type/:id/subgraph?depth=` | Subgrafo com profundidade |
| POST | `/api/resource-graph/simulate-impact` | Simular parada e blast radius |
| POST | `/api/resource-graph/relationships` | Criar aresta |
| DELETE | `/api/resource-graph/relationships/:id` | Deletar aresta |
| GET | `/api/search/unified-search` | Busca global em 5 fontes |

### Frontend

#### Dependências

- `@xyflow/react` (v12.2.0) — React Flow para grafos interativos
- `dagre` (v0.8.5) — Layout hierárquico automático

#### Componentes

##### `packages/frontend/src/shared/components/ResourceGraph.tsx`
- Wrapper de React Flow com:
  - Nós customizados por resourceType (cores, ícones, badges de status)
  - Layout automático via dagre (rankdir: TB)
  - Três modos: `overview` (grafo geral), `subgraph` (drill-down), `impact` (blast radius)
  - MiniMap, Controls, Background
  - Destaque gradual de nós impactados (profundidade → cor)
  - Clique para seleção, duplo-clique para navegação

##### `packages/frontend/src/shared/components/GlobalSearch.tsx` — **NOVO**
- Input de busca na topbar com autocomplete em tempo real
- Dropdown com até 10 resultados
- Navegação por clique
- Link "Ver todos os resultados" para página completa

##### `packages/frontend/src/pages/SearchResultsPage.tsx` — **NOVO**
- Página `/search?q=...` com resultados completos
- Paginação
- Filtro por tags (extensível)
- Badges por resourceType

#### Páginas

##### `packages/frontend/src/pages/DatabasesPage.tsx`
- Listagem em tabela com seleção lateral
- Painel de detalhes ao lado
- **Novo**: Filtro por ambiente
- Link para detalhe

##### `packages/frontend/src/pages/DatabaseDetailPage.tsx`
- Identificação (engine, version, port, etc.)
- **Novo**: Seção "Grafo de Dependências" com `ResourceGraph` (modo subgraph) + botão "Simular Impacto"
- Resultado de impacto com contagem total e destaque

##### `packages/frontend/src/pages/UrlsPage.tsx`
- Listagem em tabela
- **Novo**: Filtro por tipo de URL
- Painel de detalhes ao lado

##### `packages/frontend/src/pages/UrlDetailPage.tsx`
- Detalhe da URL com info do proprietário

##### `packages/frontend/src/pages/ServerDetailPage.tsx` — **Melhorado**
- **Novo**: Seção "Dependências e Relacionamentos" com subgrafo + simulação de impacto

##### `packages/frontend/src/pages/ApplicationDetailPage.tsx` — **Melhorado**
- **Novo**: Seção "Grafo de Dependências" com subgrafo + simulação de impacto

##### `packages/frontend/src/pages/EcosystemPage.tsx` — **Reformulada**
- Grafo geral via `ResourceGraph` (modo overview)
- Painel lateral com legenda (cores por type)
- Seleção de nó mostra detalhes
- Botão "Simular Impacto" mostra blast radius colorido + lista por profundidade

#### Hooks (TanStack Query v5)

- `useDatabases(filters)` — Listar databases com cache
- `useDatabase(id)` — Detalhe de uma database
- `useCreateDatabase()`, `useUpdateDatabase()`, `useDeleteDatabase()` — CRUD mutations
- `useUrls(filters)`, `useUrl(id)`, CRUD mutations — Análogo para URLs
- `useFullGraph(filters, pagination)` — Grafo completo
- `useSubgraph(resourceType, resourceId, depth)` — Subgrafo com profundidade
- `useSimulateImpact()` — Mutation para simular parada
- `useCreateRelationship()`, `useDeleteRelationship()` — Gerenciar arestas

#### Rotas

```
/databases — Listagem
/databases/:id — Detalhe
/urls — Listagem
/urls/:id — Detalhe
/search?q=... — Resultados de busca
/ecosystem — Grafo geral (reformulado)
```

#### Navegação

- AppLayout.tsx — **Atualizado** com GlobalSearch na topbar
- NAV_ITEMS — Links para "/databases" e "/urls"

## Fluxos Principais

### 1. Busca Global

**Ator**: Usuário
**Fluxo**:
1. Digita no input de busca na topbar
2. Após 300ms de inatividade, faz request a `/api/search/unified-search?q=...`
3. Mostra até 10 resultados em dropdown (server, application, database, url, catalog_entity)
4. Clica em um resultado → navega para `/servers/:id`, `/applications/:id`, etc.
5. Ou clica "Ver todos" → vai para `/search?q=...` com paginação completa

**Backend**:
- `unifiedSearch()` faz `SELECT ... FROM servers WHERE search_vector @@ to_tsquery(...) UNION ALL ...` (5 fontes)
- Retorna `{ items: [{ id, resourceType, label, description, status, environment }], pagination }`

### 2. Drill-Down em Grafo

**Ator**: Usuário em ServerDetailPage, ApplicationDetailPage, ou EcosystemPage
**Fluxo**:
1. Vê subgrafo de dependências (seção em detalhe ou painel lateral)
2. Double-click em um nó do grafo
3. Navega para `/servers/:id`, `/applications/:id`, `/databases/:id`, ou `/urls/:id`
4. Volta via browser back-button

**Backend**:
- `/api/resource-graph/:type/:id/subgraph?depth=2` retorna nós e arestas até profundidade 2
- CTE recursiva com `path` para ciclo-detection

### 3. Simulação de Impacto

**Ator**: Usuário em detalhe de recurso (Server, Application, Database) ou EcosystemPage
**Fluxo**:
1. Clica "Simular Impacto"
2. Faz POST a `/api/resource-graph/simulate-impact` com `{ resourceType, resourceId }`
3. Grafo muda de modo `subgraph` → `impact`
4. Nós impactados ficam vermelhos (gradual por profundidade)
5. Painel lateral mostra "Análise de Impacto" com contagem total e breakdown por tipo

**Backend**:
- `getTransitiveImpact(resourceType, resourceId)` executa CTE recursiva:
  ```sql
  WITH RECURSIVE impact AS (
    SELECT source_id, target_id, 0 as depth, ARRAY[...] as path
    FROM resource_relationships
    WHERE source_type = ? AND source_id = ? AND relation_type IN (...)
    UNION ALL
    SELECT impact.source_id, rr.target_id, impact.depth + 1, ...
    FROM resource_relationships rr
    JOIN impact ON rr.source_id = impact.target_id
    WHERE impact.depth < 5 AND NOT (rr.target_id = ANY(impact.path))
  )
  SELECT ... FROM impact
  ```
- Agrupa por type e depth
- Retorna `{ impactedResources, byType, byDepth, totalImpacted, hasCycle }`

### 4. Filtro por Tags/Ambiente

**Ator**: Usuário em DatabasesPage ou UrlsPage
**Fluxo**:
1. Seleciona filtro (ex: "production" em DatabasesPage)
2. Query se atualiza com `?environment=production`
3. Listagem recarrega via TanStack Query

**Backend**:
- `/api/databases?environment=production&tags=critical,important` filtra via WHERE clauses

## Protecção contra Ciclos e Performance

### Ciclo-Detection

- Array `path` acumulado em cada nível da CTE recursiva
- `NOT (target_id = ANY(path))` previne infinita recursão
- Teste com fixture A→B→C→A valida detecção

### Performance

- Índices compostos em `(source_type, source_id)`, `(target_type, target_id)` nas arestas
- Índices GIN em `tags` para filtro rápido
- Limites rígidos: maxDepth=5, maxNodes=500 (validação no controller)
- `EXPLAIN ANALYZE` deve ser rodado em staging antes de prod

## Testes

### Frontend E2E (Playwright)

`packages/e2e/tests/search-and-impact.spec.ts`:
- ✅ Busca global encontra servidores, apps, bancos, URLs
- ✅ Subgrafo visível em detalhe de servidor
- ✅ Simulação de impacto mostra blast radius
- ✅ Filtro por ambiente em databases
- ✅ Ecossistema mostra legenda de tipos
- ✅ Resultados de busca com paginação
- ✅ Drill-down em nó navega para detalhe

### Backend Unit Tests

`packages/backend/src/modules/search/infrastructure/search.repository.test.ts`:
- ✅ buildPrefixTsQuery() converte palavras em prefixo
- ✅ unifiedSearch() encontra em múltiplas fontes
- ✅ Filtro por tags funciona
- ✅ Paginação sem duplicatas

`packages/backend/src/modules/resource-graph/application/graph.service.test.ts`:
- ✅ simulateImpact() agrupa por type e depth
- ✅ Ciclos são marcados
- ✅ Recursos isolados retornam impacto vazio
- ✅ getTransitiveImpact() é chamado corretamente

## Integração de Dados Legados

- `application_deployments` (server→app "hosts") migrado para `resource_relationships`
- `application_dependencies` (app→app "depends_on") migrado para `resource_relationships`
- `catalog_entity_relations` permanece separado (conceitos `system`/`domain`/`api` do Service Catalog não mapeiam 1:1)

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| CTE recursiva não termina | Array `path` com ciclo-detection obrigatório; maxDepth=5 |
| Grafo muito grande | Limite rígido 500 nós; filtro obrigatório no UI |
| Integridade referencial polimórfica | Validação em service layer + trigger de validação (opcional) + auditoria periódica |
| Performance de busca full-text | Índices GIN em `search_vector`; EXPLAIN ANALYZE antes de prod |
| Regressão no search existente | `unifiedSearch()` é novo; `search()` permanece inalterado |

## Próximas Iterações

1. **Auto-discovery** — API para scan de servidores/apps/bancos e auto-população de `resource_relationships`
2. **Alertas de impacto** — Notificar times quando recurso crítico tem mudança de status
3. **Histórico de relações** — Soft-delete de arestas com audit trail
4. **Métricas de saúde** — Monitorar integridade do grafo (arestas órfãs, nós desconexos)
5. **Filtros avançados** — Salvar e compartilhar filtros de grafo por time
6. **API GraphQL** — Alternativa a REST para queries complexas de grafo

## Checklist de Validação Pre-Prod

- [ ] Migrations rodadas em staging com dados reais
- [ ] Full-text search testado em português com acentos
- [ ] Ciclo-detection validado com fixture A→B→C→A
- [ ] Grafo >500 nós retorna erro com sugestão de filtro
- [ ] Tests E2E passam (Playwright)
- [ ] EXPLAIN ANALYZE em CTE recursiva <100ms para recursos típicos
- [ ] Soft-delete funciona (deleted_at != null não aparece em queries)
- [ ] RBAC aplicado (viewers não criam, apenas leem)
- [ ] Auditoria registra todas as mutações em `resource_relationships`
