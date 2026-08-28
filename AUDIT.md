# Auditoria — Platform Engineering Center (back-stage)

Auditoria feita como um dev sênior revisando o repositório de ponta a ponta, com foco na feature central do produto: documentar a infraestrutura (servidores, serviços, aplicações, URLs) e mostrar graficamente as dependências entre elas e o impacto de uma parada.

## Antes de tudo: o que já está bom

Vale registrar isso porque não é óbvio de fora. O backend já modela o domínio certo (servidores, aplicações, bancos, URLs, VIPs, relacionamentos tipados: `depends_on`, `hosts`, `connects_to`, `exposes`) e expõe endpoints reais de grafo completo, simulação de impacto (`useSimulateImpact` → "simular parada") e recursos críticos/SPOF (`useCriticalResources`). O componente `ResourceGraph.tsx` (xyflow + dagre) já resolve um problema difícil bem: layout automático, containers de servidor com apps "encaixados" como chips, cores por profundidade de impacto (fonte → direto → indireto), modo de edição para criar relações arrastando. Isso não é um protótipo — é engenharia séria, com posições persistidas, undo de layout, exportação PNG/PDF. O ponto fraco nunca foi a lógica; foi a superfície: identidade visual genérica e funcionalidade duplicada em paralelo.

## Achados

### 1. Três motores de grafo para o mesmo problema (severidade: alta)
O `.ai/08-grafh.md` (spec original) previa D3.js. Na prática, o repo acumulou:
- `DependencyGraph.tsx` — D3 puro, usado só em `ServiceDetailPage` (catálogo legado).
- `DependencyGraphVizualizer.tsx` — Cytoscape, usado no modo "Cascata" da página Ecossistema.
- `ResourceGraph.tsx` — xyflow + dagre, o motor principal (Ecossistema modo "Grafo", edição de relações).

Três bibliotecas de grafo (`d3`, `cytoscape`, `@xyflow/react`+`dagre`) mais `raphael`, `html2canvas` e `jspdf` no mesmo `package.json` do frontend. Isso custa bundle (o build de produção já acusa `EcosystemPage` com 465 kB e `jspdf` com 592 kB minificados, acima do limite recomendado) e custa manutenção — três formas diferentes de estilizar o mesmo "nó" e a mesma "aresta". Recomendo consolidar em `@xyflow/react` (o mais completo hoje) e avaliar se o modo "Cascata" (Cytoscape) ainda se justifica ou se vira mais um layout do xyflow.

### 2. `DependencyTreePage` era uma reimplementação paralela de qualidade inferior (severidade: alta — **corrigido nesta sessão**)
Rota `/dependency-tree`, item de menu "Árvore de Deps", 552 linhas. Reconstruía do zero exatamente o que `EcosystemPage` já faz: criar relações e visualizar o grafo. Mas com `<canvas>` desenhado manualmente à mão (drag customizado, sem dagre), estilos `style={{...}}` inline em vez do padrão Tailwind do resto do app, e emojis como ícone (`🖥️ 📱 🗄️ 🌐 ➕ 🎨 🗑️ 📭`) — inconsistente com o design system real do app, que já tem um icon set SVG próprio em `shared/components/icons.tsx`. Sem cobertura de teste e2e dedicada (os specs existentes cobrem `ecosystem-*` e `search-and-impact`, nada de `dependency-tree`). Removido: arquivo, rota e item de menu.

### 3. Zero sistema de design (severidade: alta — **corrigido nesta sessão**)
`tailwind.config.ts` estava com `theme.extend = {}` — nenhuma cor, nenhuma fonte, nada de próprio. `index.css` tinha só as 3 diretivas do Tailwind. Sem `<link>` de fonte no `index.html`. Resultado: o app inteiro rodava na paleta cinza padrão do Tailwind e na fonte do sistema operacional — visualmente indistinguível de qualquer outro dashboard gerado rapidamente. Para uma ferramenta que times de infra vão abrir durante um incidente, isso é oportunidade perdida: não há hierarquia visual deliberada entre "isso é uma leitura de status" e "isso é um rótulo decorativo".

### 4. Ícones de emoji onde já existe um icon set consistente (severidade: média — **corrigido nesta sessão**)
Além do `DependencyTreePage` removido, o próprio `ResourceGraph.tsx` (o motor principal!) usava emoji (`🖥 ⚙ 🗄 🌐 📦`) para os tipos de recurso, enquanto `AppLayout.tsx` e o resto do app usam SVGs de `icons.tsx`. Emoji renderiza de forma diferente por SO/fonte do sistema e não tem o peso visual de um ícone desenhado — é um dos sinais mais claros de "ferramenta interna feita rápido" em vez de produto com identidade própria.

### 5. Higiene de repositório (severidade: média — **corrigido nesta sessão**)
- `backend.pid`, `frontend.pid`, `backend.err` estavam versionados no git (artefatos de runtime, nunca deveriam ser commitados). Removidos do índice e adicionados ao `.gitignore` (`*.pid`, `*.err`).
- 5 arquivos HTML soltos na raiz do repo (`dependency-map.html`, `dependency-map-complex.html`, `grafo-simples.html`, `grafo-svg.html`, `mapa-dependencias.html`, ~65 KB) — protótipos de exploração visual do mesmo grafo de dependências, nunca limpos. Movidos para `docs/design-exploration/` (histórico preservado via `git mv`) em vez de simplesmente apagados.
- 12 markdown de "resumo de fase"/"pronto para produção" na raiz (`START_HERE.md`, `HOW_TO_ACCESS.md`, `IMPLEMENTATION_SUMMARY.md`, `FINAL_DEPLOYMENT_SUMMARY.md`, `PHASE-1-SUMMARY.md`, `VERIFY_AND_RUN.md`, `STAGING_VALIDATION_PLAN.md`, `PRODUCTION_DEPLOYMENT_RUNBOOK.md`, `DEPLOYMENT_CHECKLIST.md`, `CODE_REVIEW_CHECKLIST.md`, `FEATURE_CMDB_IMPLEMENTATION.md`, `QUICK_START_LOCAL.md`) — sobras de sessões anteriores de IA, sem link algum apontando para eles em README ou CI. Movidos para `docs/archive/`. `README.md` e `DEVELOPMENT.md` continuam na raiz.
- 5 arquivos-lixo na raiz com nome corrompido (`E:_workspaces_GitHubback-stage...md`) — resultado de um path absoluto do Windows mal interpretado por alguma ferramenta em sessão anterior. Apagados (não eram rastreados pelo git).

### 6. Ambiente local com symlinks de workspace corrompidos (severidade: média, ambiental)
`node_modules/@back-stage/*` estavam com erro de I/O ao resolver os symlinks do npm workspaces, o que quebrava `tsc` com `Cannot find module '@back-stage/shared'`. Corrigido com `npm install` (não é bug de código — é o tipo de coisa que só aparece nesse ambiente de mount cross-plataforma; documentando aqui para não ser confundido com erro de tipos).

### 7. Dependências com vulnerabilidades conhecidas (severidade: a revisar)
`npm audit` acusa 45 vulnerabilidades em dependências de produção (41 moderate, 4 high) após a limpeza — a maior parte encadeada a partir de `react-router-dom`/`uuid`/`gaxios`. Não rodei `npm audit fix` porque pode alterar versões maiores sem eu conseguir rodar a suíte de testes contra um backend real neste ambiente (Postgres/Redis não disponíveis aqui). Recomendo o time rodar `npm audit fix` (sem `--force`) e revisar o restante manualmente.

### 8. Teste e2e de "Ecosystem graph" com falha registrada
`test-results/` já contém uma execução falha de `ecosystem-graph-Ecosystem--18cb3-erver-and-application-nodes-chromium` (screenshot + contexto de erro salvos). Não investiguei a causa raiz (precisa de backend rodando), mas fica registrado — vale rodar `npm run test:e2e` no pacote `frontend` ou `e2e` com o stack completo de pé.

### 9. Quebras de linha CRLF sem `.gitattributes`
Vários arquivos de código (`ResourceGraph.tsx`, `EcosystemPage.tsx`, entre outros) estão salvos com CRLF, sem um `.gitattributes` normalizando isso. Não é urgente, mas é uma fonte clássica de diffs gigantes e "reformatação fantasma" quando alguém no time usa uma máquina configurada diferente. Sugiro adicionar `.gitattributes` com `* text=auto eol=lf` numa PR separada (mudança grande, melhor isolada).

## O que foi implementado nesta sessão

1. **Limpeza de repositório** — arquivos `.pid`/`.err` desversionados, protótipos e docs de fase arquivados em `docs/`, lixo de sessões anteriores removido, `.gitignore` atualizado.
2. **Sistema de design** (`tailwind.config.ts`, `index.css`) — paleta com tokens nomeados (`canvas`, `surface`, `line`, `signal`, `resource.*`, `impact.*`) formalizando o que já era usado como hex solto; tipografia própria autohospedada (`@fontsource/inter` para UI/prose, `@fontsource/jetbrains-mono` para dados técnicos — rótulos de tipo de recurso, status, o console de simulação), reaproveitando um padrão que o próprio app já usava esporadicamente (`font-mono` em campos de código).
3. **Fundo unificado** — as 44 ocorrências de `bg-slate-950` (cor de fundo "oficial" de facto do app, espalhada em 28 arquivos) trocadas por `bg-canvas`, o token central.
4. **Ícones consistentes** — dois ícones novos (`DatabaseIcon`, `GlobeIcon`) no set SVG existente; `ResourceGraph.tsx` trocou todo emoji por esses ícones.
5. **Elemento de assinatura — "console de impacto"**: ao simular uma parada, o nó de origem agora emite um pulso radar (anel expandindo, `animate-radar-ping`) atrás dele no grafo, e o antigo badge genérico "Simulação ativa" virou uma leitura estilo terminal (`> simulando parada — N recursos afetados`) em monoespaçada, com um indicador vivo (ping) — a ideia é que o momento de "isso aqui vai cair, veja o que mais cai junto" tenha peso visual proporcional ao que ele significa operacionalmente, em vez de ser só mais uma badge colorida entre outras.
6. **Removida a página duplicada** `DependencyTreePage` (rota, item de menu e arquivo).

Todas as mudanças foram verificadas com `tsc --noEmit` (limpo) e com um build de produção real (`vite build`, sucesso) — não consegui subir o stack completo (Postgres/Redis não disponíveis neste ambiente) para um teste visual ao vivo, então recomendo conferir visualmente com `npm run dev` antes de dar por definitivo.

## Próximos passos sugeridos (não feitos agora, por escopo/risco)

- Decidir o destino do modo "Cascata" (Cytoscape): portar para xyflow ou remover, para eliminar de vez uma das três bibliotecas de grafo.
- Revisar `npm audit fix` com a suíte de testes rodando contra um ambiente real.
- Investigar a falha registrada em `ecosystem-graph` (Playwright).
- Adicionar `.gitattributes` para normalizar quebras de linha (mudança maior, isolar em PR própria).
- Estender os novos tokens de cor (`resource.*`, `impact.*`) aos demais componentes que ainda usam hex inline equivalente, para que a paleta tenha uma única fonte de verdade.
