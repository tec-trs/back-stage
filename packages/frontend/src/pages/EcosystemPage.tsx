import { lazy, Suspense, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { useDatabaseGroups } from '../features/database-groups/use-database-groups';
import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import {
  useCreateRelationship,
  useDeleteRelationship,
  useFullGraph,
} from '../features/resource-graph/use-resource-graph';
import type { GraphNode, ImpactResult } from '../features/resource-graph/use-resource-graph';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { DependencyGraphVizualizer } from '../shared/components/DependencyGraphVizualizer';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import type { ConnPayload } from '../shared/components/ResourceGraph';
import { Spinner } from '../shared/components/Spinner';

const ResourceGraph = lazy(() => import('../shared/components/ResourceGraph').then(m => ({ default: m.ResourceGraph })));

type ResourceType = 'server' | 'application' | 'database' | 'url' | 'vip';

const VALID_RESOURCE_TYPES = new Set<string>(['server', 'application', 'database', 'url', 'vip']);

type EcoNode = Omit<GraphNode, 'resourceType'> & {
  resourceType: ResourceType | 'db-group';
  dbLabels?: string[];
};

interface DbGroup {
  id: string;
  dbIds: string[];
  dbLabels: string[];
}

// Prefix for the synthetic node id of a curated-grupo cluster (see the
// clustering memo below) — the suffix is the real Agrupador de Bancos id,
// which is what lets Ver Detalhes / duplo-clique navigate straight to
// /database-groups/:id. The other db-group flavor (per-aplicação
// auto-clustering, id `db-group-${appId}`) has no single real grupo behind
// it, so it stays non-navigable.
const CURATED_DB_GROUP_PREFIX = 'db-group-curated-';

function curatedGroupIdFromNodeId(nodeId: string): string | undefined {
  return nodeId.startsWith(CURATED_DB_GROUP_PREFIX) ? nodeId.slice(CURATED_DB_GROUP_PREFIX.length) : undefined;
}

const NODE_COLORS: Record<string, string> = {
  server:      '#3b82f6',
  application: '#8b5cf6',
  database:    '#ec4899',
  'db-group':  '#a855f7',
  url:         '#f59e0b',
  vip:         '#06b6d4',
};

const NODE_LABELS: Record<string, string> = {
  server:      'Servidor',
  application: 'Aplicacao',
  database:    'Banco de Dados',
  'db-group':  'Bancos (agrupado)',
  url:         'URL',
  vip:         'VIP',
};

interface PendingConn extends ConnPayload {
  sourceLabel: string;
  targetLabel: string;
}

const RELATION_OPTIONS = [
  { value: 'depends_on',  label: 'Depende de',  hint: 'A origem depende do destino para funcionar' },
  { value: 'connects_to', label: 'Conecta a',    hint: 'A origem faz chamadas ao destino' },
  { value: 'hosts',       label: 'Hospeda',       hint: 'A origem hospeda / executa o destino' },
  { value: 'exposes',     label: 'Expoe',         hint: 'A origem expoe o destino publicamente' },
] as const;

type RelationValue = (typeof RELATION_OPTIONS)[number]['value'];

function ConnectionModal({
  pending,
  isBusy,
  onConfirm,
  onCancel,
  error,
}: {
  pending: PendingConn;
  isBusy: boolean;
  onConfirm: (relationType: RelationValue, reason?: string, isInverted?: boolean) => void;
  onCancel: () => void;
  error?: string;
}) {
  const [relationType, setRelationType] = useState<RelationValue>('depends_on');
  const [reason, setReason] = useState('');
  const [isInverted, setIsInverted] = useState(false);

  const sourceLabel = isInverted ? pending.targetLabel : pending.sourceLabel;
  const targetLabel = isInverted ? pending.sourceLabel : pending.targetLabel;

  return (
    <Modal title="Criar relacao" isOpen onClose={onCancel}>
      <div className="flex flex-col gap-4">
        {error && <ErrorMessage message={error} />}
        <div className="rounded-md border border-slate-600 bg-slate-700/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Relacionamento</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-100">{sourceLabel}</span>
              <span className="text-slate-400">→</span>
              <span className="font-medium text-slate-100">{targetLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsInverted(!isInverted)}
              className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-100 transition"
              title="Inverter direção"
            >
              ⇄
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-2">Clique ⇄ para inverter a direção se necessário</p>
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-medium text-slate-300">Tipo de relacao</legend>
          {RELATION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-slate-800"
            >
              <input
                type="radio"
                name="relationType"
                value={opt.value}
                checked={relationType === opt.value}
                onChange={() => setRelationType(opt.value)}
                className="mt-0.5 accent-sky-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-200">{opt.label}</p>
                <p className="text-xs text-slate-400">{opt.hint}</p>
              </div>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-300">Motivo (opcional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: X precisa acessar Y para autenticação"
            className="rounded-md border border-slate-600 bg-canvas px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-slate-500 focus:outline-none resize-none"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-600 pt-3">
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={isBusy}>
            Cancelar
          </Button>
          <Button size="sm" onClick={() => onConfirm(relationType, reason || undefined, isInverted)} disabled={isBusy}>
            {isBusy ? 'Criando...' : 'Criar relacao'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const EMPTY_SET = new Set<string>();

export function EcosystemPage() {
  const { data: fullGraphData, isLoading, isError, error } = useFullGraph({ page: 1, pageSize: 500 });
  const { data: databaseGroups } = useDatabaseGroups();
  const data = useMemo(() => {
    if (!fullGraphData) return undefined;
    const nonGroupNodeIds = new Set(fullGraphData.nodes.filter(n => (n.resourceType as string) !== 'group').map(n => n.id));
    return {
      ...fullGraphData,
      nodes: fullGraphData.nodes.filter(n => (n.resourceType as string) !== 'group'),
      edges: fullGraphData.edges.filter(e => nonGroupNodeIds.has(e.sourceId) && nonGroupNodeIds.has(e.targetId)),
    };
  }, [fullGraphData]);
  const navigate = useNavigate();


  const [selectedNodeId,   setSelectedNodeId]   = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<ResourceType | null>(null);

  // Visualization mode
  const [visualizationMode, setVisualizationMode] = useState<'graph' | 'flow'>('graph');

  // Compact mode (persisted in localStorage)
  const [compactMode, setCompactMode] = useState(() => {
    try {
      const saved = localStorage.getItem('ecosystem-compact-mode');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ecosystem-compact-mode', JSON.stringify(compactMode));
    } catch {
      // ignore
    }
  }, [compactMode]);

  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
    new Set(['server', 'application', 'database', 'url', 'vip'])
  );

  // Search/highlight
  const [searchTerm, setSearchTerm] = useState('');

  // Grouping by environment/tag
  const [groupBy, setGroupBy] = useState<'none' | 'environment' | 'tag'>('none');

  // Edit-mode (drag-and-drop relationship creation)
  const [editMode,       setEditMode]       = useState(false);
  const [pendingConn,    setPendingConn]    = useState<PendingConn | null>(null);
  const [connectionError, setConnectionError] = useState<string>('');
  const [resetLayoutKey, setResetLayoutKey] = useState(0);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const prevNodeCountRef = useRef<number>(0);
  const createRel = useCreateRelationship();
  const deleteRel = useDeleteRelationship();

  // Auto-reset layout quando número de nós muda significativamente
  useEffect(() => {
    if (data && data.nodes.length !== prevNodeCountRef.current) {
      // Se a diferença for > 0, significa que um novo nó foi adicionado
      // Reset o layout para que as posições antigas não influenciem
      if (data.nodes.length > prevNodeCountRef.current && prevNodeCountRef.current > 0) {
        setResetLayoutKey(k => k + 1);
      }
      prevNodeCountRef.current = data.nodes.length;
    }
  }, [data?.nodes.length]);

  // Simulation state — kept here so the graph reflects the blast radius
  const [simulationSourceId, setSimulationSourceId] = useState<string | undefined>(undefined);
  const [impactedByDepth,    setImpactedByDepth]    = useState<Map<string, number>>(new Map());

  const impactedNodeIds = useMemo(() => new Set(impactedByDepth.keys()), [impactedByDepth]);

  const toggleTypeFilter = useCallback((type: string) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const graphContainerRef = useRef<HTMLDivElement>(null);

  const handleExportPNG = useCallback(async () => {
    if (!graphContainerRef.current) return;
    try {
      const canvas = await html2canvas(graphContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.href = canvas.toDataURL();
      link.download = `ecosistema-${new Date().toISOString().split('T')[0]}.png`;
      link.click();
      setShowExportMenu(false);
    } catch (err) {
      console.error('Erro ao exportar PNG:', err);
    }
  }, []);

  const handleExportPDF = useCallback(async () => {
    if (!graphContainerRef.current) return;
    try {
      const canvas = await html2canvas(graphContainerRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`ecosistema-${new Date().toISOString().split('T')[0]}.pdf`);
      setShowExportMenu(false);
    } catch (err) {
      console.error('Erro ao exportar PDF:', err);
    }
  }, []);

  // Search/highlight — derived, no setState-in-effect pattern
  const highlightedNodeIds = useMemo(() => {
    if (!searchTerm.trim() || !data) return EMPTY_SET;
    const term = searchTerm.toLowerCase();
    const matches = new Set<string>();
    for (const node of data.nodes) {
      if (node.label.toLowerCase().includes(term) || node.id.toLowerCase().includes(term)) {
        matches.add(node.id);
      }
    }
    return matches;
  }, [searchTerm, data]);

  // ── Agrupamento de bancos no diagrama ─────────────────────────────────
  // Dois gatilhos, nessa ordem de precedência:
  //   1. Agrupador curado (Agrupadores de Bancos): colapsa sempre que 2+
  //      dos seus bancos aparecem neste grafo, independente de quantas
  //      dependências reais já existem — a documentação em si é o gatilho,
  //      não a contagem de relacionamentos. Agrupador menor primeiro, para
  //      que um agrupador mais específico "ganhe" de um mais genérico que
  //      também contenha o mesmo banco.
  //   2. Fallback automático: aplicação com 2+ dependências reais de banco
  //      ainda colapsa mesmo sem agrupador — útil para desafogar o
  //      diagrama antes de existir documentação. Só considera bancos que
  //      nenhum agrupador curado já reivindicou no passo 1.
  const { graphNodes, graphEdges, dbGroups } = useMemo(() => {
    if (!data) return { graphNodes: [], graphEdges: [], dbGroups: [] };

    const nodeById = new Map(data.nodes.map((n) => [n.id, n]));

    // dbId → id do nó sintético que o representa neste diagrama.
    const dbIdToGroupNodeId = new Map<string, string>();
    // id do nó sintético → rótulo e lista de dbIds que ele representa.
    const groupMeta = new Map<string, { label: string; dbIds: string[] }>();

    const sortedGroups = (databaseGroups ?? [])
      .filter((g) => g.databaseIds && g.databaseIds.length > 0)
      .slice()
      .sort((a, b) => (a.databaseIds!.length - b.databaseIds!.length));

    for (const group of sortedGroups) {
      const presentDbIds = group.databaseIds!.filter((dbId) => {
        if (dbIdToGroupNodeId.has(dbId)) return false; // já reivindicado por um agrupador mais específico
        return nodeById.get(dbId)?.resourceType === 'database';
      });
      if (presentDbIds.length < 2) continue;

      const groupNodeId = `${CURATED_DB_GROUP_PREFIX}${group.id}`;
      groupMeta.set(groupNodeId, { label: group.name, dbIds: presentDbIds });
      for (const dbId of presentDbIds) dbIdToGroupNodeId.set(dbId, groupNodeId);
    }

    // Mapa appId → edges de banco (sourceId=app, targetId=db), ignorando
    // bancos que já foram reivindicados por um agrupador curado acima.
    const appDbEdgeMap = new Map<string, typeof data.edges>();
    for (const edge of data.edges) {
      const src = nodeById.get(edge.sourceId);
      const tgt = nodeById.get(edge.targetId);
      if (
        src?.resourceType === 'application' &&
        tgt?.resourceType === 'database' &&
        !dbIdToGroupNodeId.has(edge.targetId)
      ) {
        if (!appDbEdgeMap.has(edge.sourceId)) appDbEdgeMap.set(edge.sourceId, []);
        appDbEdgeMap.get(edge.sourceId)!.push(edge);
      }
    }

    for (const [appId, dbEdges] of appDbEdgeMap) {
      if (dbEdges.length < 2) continue;

      const groupNodeId = `db-group-${appId}`;
      const dbIds = dbEdges.map((e) => e.targetId);
      groupMeta.set(groupNodeId, { label: `${dbIds.length} bancos`, dbIds });
      for (const dbId of dbIds) dbIdToGroupNodeId.set(dbId, groupNodeId);
    }

    const groups: DbGroup[] = Array.from(groupMeta.entries()).map(([id, meta]) => ({
      id,
      dbIds: meta.dbIds,
      dbLabels: meta.dbIds.map((dbId) => nodeById.get(dbId)?.label ?? dbId),
    }));

    const hiddenNodeIds = new Set(dbIdToGroupNodeId.keys());
    const syntheticNodes: EcoNode[] = groups.map((g) => ({
      id: g.id,
      resourceType: 'db-group',
      label: groupMeta.get(g.id)!.label,
      dbLabels: g.dbLabels,
    }));

    // Redireciona QUALQUER aresta que toque um banco agrupado (não só
    // "hospeda" de servidor, como antes) para o nó sintético do grupo —
    // assim um servidor, outra aplicação ou qualquer outra relação real
    // continua aparecendo no diagrama em vez de desaparecer silenciosamente
    // porque seu alvo virou um nó oculto. Arestas que colapsariam para o
    // mesmo par (origem, destino, tipo) — por exemplo, duas aplicações
    // distintas dependendo de bancos diferentes do mesmo agrupador — são
    // deduplicadas.
    function redirect(type: string, id: string): { type: string; id: string } {
      const groupNodeId = type === 'database' ? dbIdToGroupNodeId.get(id) : undefined;
      return groupNodeId ? { type: 'db-group', id: groupNodeId } : { type, id };
    }

    const hiddenEdgeIds = new Set<string>();
    const syntheticEdgeByKey = new Map<string, (typeof data.edges)[number]>();

    for (const edge of data.edges) {
      const src = redirect(edge.sourceType, edge.sourceId);
      const tgt = redirect(edge.targetType, edge.targetId);
      const unchanged =
        src.type === edge.sourceType && src.id === edge.sourceId && tgt.type === edge.targetType && tgt.id === edge.targetId;
      if (unchanged) continue;

      hiddenEdgeIds.add(edge.id);
      if (src.type === tgt.type && src.id === tgt.id) continue; // colapsou num auto-relacionamento — descarta

      const key = `${src.type}:${src.id}->${tgt.type}:${tgt.id}:${edge.relationType}`;
      if (!syntheticEdgeByKey.has(key)) {
        syntheticEdgeByKey.set(key, {
          ...edge,
          id: `edge-${key}`,
          sourceType: src.type,
          sourceId: src.id,
          targetType: tgt.type,
          targetId: tgt.id,
        });
      }
    }
    const syntheticEdges = Array.from(syntheticEdgeByKey.values());

    // Apply type filters
    const filteredNodes = [
      ...(data.nodes.filter((n) => !hiddenNodeIds.has(n.id) && visibleTypes.has(n.resourceType)) as EcoNode[]),
      ...syntheticNodes.filter(() => visibleTypes.has('database')), // db-group só aparece se database visível
    ] as EcoNode[];


    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = [
      ...data.edges.filter((e) => !hiddenEdgeIds.has(e.id) && filteredNodeIds.has(e.sourceId) && filteredNodeIds.has(e.targetId)),
      ...syntheticEdges.filter((e) => filteredNodeIds.has(e.sourceId) && filteredNodeIds.has(e.targetId)),
    ];

    // Apply groupBy: dynamically add displayGroup based on environment/tag
    let finalNodes = filteredNodes;
    if (groupBy === 'environment') {
      finalNodes = filteredNodes.map((n) => {
        const orig = data.nodes.find((d) => d.id === n.id);
        if (orig && 'environment' in orig) {
          return { ...n, displayGroup: (orig as any).environment ?? null };
        }
        return n;
      });
    } else if (groupBy === 'tag') {
      // For tag grouping, we'd need to duplicate nodes for each tag - too complex, skip for now
      // Just add first tag as display group
      finalNodes = filteredNodes.map((n) => {
        const orig = data.nodes.find((d) => d.id === n.id);
        if (orig && 'tags' in orig && Array.isArray((orig as any).tags) && (orig as any).tags.length > 0) {
          return { ...n, displayGroup: (orig as any).tags[0] ?? null };
        }
        return n;
      });
    }


    return {
      graphNodes: finalNodes,
      graphEdges: filteredEdges,
      dbGroups: groups,
    };
  }, [data, visibleTypes, groupBy, databaseGroups]);

  const selectedNode = graphNodes.find((n) => n.id === selectedNodeId);

  const handleNodeSelect = useCallback((nodeId: string, resourceType: string) => {
    if (resourceType === 'server-group') return; // container visual — sem painel
    setSelectedNodeId(nodeId);
    if (VALID_RESOURCE_TYPES.has(resourceType)) setSelectedNodeType(resourceType as ResourceType);
  }, []);

  const handleNodeNavigate = useCallback(
    (nodeId: string, resourceType: string) => {
      if (resourceType === 'server-group') return;
      if (resourceType === 'db-group') {
        const groupId = curatedGroupIdFromNodeId(nodeId);
        if (groupId) navigate(`/database-groups/${groupId}`);
        return;
      }
      const pathMap: Record<string, string> = {
        server:      'servers',
        application: 'applications',
        database:    'databases',
        url:         'urls',
      };
      navigate(`/${pathMap[resourceType] ?? resourceType + 's'}/${nodeId}`);
    },
    [navigate],
  );

  const handleImpactResult = useCallback((result: ImpactResult, sourceId: string) => {
    const byDepth = new Map<string, number>();
    for (const node of result.impactedResources) {
      byDepth.set(node.resourceId, node.depth);
    }
    // Propaga impacto para nós db-group: usa o menor depth entre seus bancos
    for (const group of dbGroups) {
      const depths = group.dbIds
        .map((id) => byDepth.get(id))
        .filter((d): d is number => d !== undefined);
      if (depths.length > 0) byDepth.set(group.id, Math.min(...depths));
    }
    setImpactedByDepth(byDepth);
    setSimulationSourceId(sourceId);
  }, [dbGroups]);

  const handleImpactReset = useCallback(() => {
    setImpactedByDepth(new Map());
    setSimulationSourceId(undefined);
  }, []);

  const handleConnect = useCallback(
    (payload: ConnPayload) => {
      const srcNode = graphNodes.find((n) => n.id === payload.sourceId);
      const tgtNode = graphNodes.find((n) => n.id === payload.targetId);
      setPendingConn({
        ...payload,
        sourceLabel: srcNode?.label ?? payload.sourceId,
        targetLabel: tgtNode?.label ?? payload.targetId,
      });
      setConnectionError('');
    },
    [graphNodes],
  );

  const handleConfirmConnect = useCallback(
    async (relationType: string, reason?: string, isInverted?: boolean) => {
      if (!pendingConn) return;
      try {
        const [sourceType, sourceId, targetType, targetId] = isInverted
          ? [pendingConn.targetType, pendingConn.targetId, pendingConn.sourceType, pendingConn.sourceId]
          : [pendingConn.sourceType, pendingConn.sourceId, pendingConn.targetType, pendingConn.targetId];

        await createRel.mutateAsync({
          sourceType,
          sourceId,
          targetType,
          targetId,
          relationType,
          reason,
        });
        setPendingConn(null);
        setConnectionError('');
      } catch (err) {
        setConnectionError(err instanceof Error ? err.message : 'Erro ao criar relacionamento');
      }
    },
    [createRel, pendingConn],
  );

  const handleEdgeDelete = useCallback(
    async (edgeId: string) => {
      await deleteRel.mutateAsync(edgeId);
    },
    [deleteRel],
  );

  if (isError)
    return (
      <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar ecossistema'} />
    );
  if (isLoading) return <Spinner />;
  if (!data || data.nodes.length === 0) {
    return (
      <div>
        <PageHeader
          title="Ecossistema"
          description="Grafo completo de recursos: servidores, aplicacoes, bancos de dados e URLs"
        />
        <ErrorMessage message="Nenhum recurso encontrado. Comece adicionando servidores ou aplicacoes." />
      </div>
    );
  }

  const isGraphLimited = data.pagination.total > 500;
  if (isGraphLimited) {
    return (
      <div>
        <PageHeader
          title="Ecossistema"
          description="Grafo completo de recursos: servidores, aplicacoes, bancos de dados e URLs"
        />
        <ErrorMessage
          message={`Grafo muito grande (${data.pagination.total} recursos). Aplique filtros para reduzir o tamanho. Ex: selecione apenas um ambiente, um tipo de recurso, ou criticalidade.`}
        />
      </div>
    );
  }

  return (
    <div className="-mx-6 -mt-6 flex flex-col" style={{ height: 'calc(100vh - 61px)' }}>
      {/* ── Toolbar refinada: seções com divisores ──────────────── */}
      <div className="border-b border-slate-600 bg-slate-900/90 px-4 py-3">
        {/* Header com titulo */}
        <div className="mb-3 pb-3 border-b border-slate-600/50">
          <h1 className="text-base font-semibold text-slate-50">Ecossistema</h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {editMode
              ? 'Arraste da bolinha azul de um nó até outro · clique × na aresta para remover'
              : 'Duplo clique no nó para abrir detalhes'}
          </p>
        </div>

        {/* Controles principais em 3 linhas */}
        <div className="flex flex-wrap items-center gap-3 mb-2">
          {/* Seção 1: Navegação */}
          <div className="flex gap-2">
            <a
              href="/relationships"
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-600 bg-slate-700/60 text-slate-100 hover:bg-slate-600/70 transition-colors"
            >
              Ver relações
            </a>
            <a
              href="/risk-analysis"
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-600 bg-slate-700/60 text-slate-100 hover:bg-slate-600/70 transition-colors"
            >
              Análise de risco
            </a>
          </div>

          {/* Divider */}
          <div className="hidden h-5 w-px bg-slate-700/50 lg:block" />

          {/* Seção 2: Modo visualização + Compact */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisualizationMode((prev) => (prev === 'graph' ? 'flow' : 'graph'))}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                visualizationMode === 'flow'
                  ? 'border-blue-600/50 bg-blue-900/30 text-blue-200'
                  : 'border-slate-600 bg-slate-700/60 text-slate-100 hover:bg-slate-600/70'
              }`}
              title={visualizationMode === 'flow' ? 'Cascata (hierárquica)' : 'Grafo (aninhado)'}
            >
              {visualizationMode === 'flow' ? 'Cascata' : 'Grafo'}
            </button>

            {visualizationMode === 'graph' && (
              <button
                type="button"
                onClick={() => setCompactMode((prev: boolean) => !prev)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                  compactMode
                    ? 'border-slate-600 bg-slate-700/40 text-slate-100'
                    : 'border-slate-600 bg-slate-700/60 text-slate-100 hover:bg-slate-600/70'
                }`}
              >
                {compactMode ? 'Compacto' : 'Expandido'}
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="hidden h-5 w-px bg-slate-700/50 lg:block" />

          {/* Seção 3: Edição + Export + Reset */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditMode((prev) => {
                if (!prev) setSelectedNodeId(null);
                return !prev;
              })}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                editMode
                  ? 'border-amber-600/50 bg-amber-900/30 text-amber-200'
                  : 'border-slate-600 bg-slate-700/60 text-slate-100 hover:bg-slate-600/70'
              }`}
            >
              {editMode ? 'Sair edição' : 'Editar'}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-600 bg-slate-700/60 text-slate-100 hover:bg-slate-600/70 transition-colors"
                title="Exportar gráfico"
              >
                Exportar
              </button>

              {showExportMenu && (
                <div className="absolute top-full mt-1 left-0 rounded-md border border-slate-600 bg-slate-800 shadow-lg z-50 min-w-max">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportPNG();
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-xs text-slate-100 hover:bg-slate-600/70 transition-colors"
                  >
                    Exportar PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleExportPDF();
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-xs text-slate-100 hover:bg-slate-600/70 transition-colors border-t border-slate-600/50"
                  >
                    Exportar PDF
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setResetLayoutKey((k) => k + 1)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-600 bg-slate-700/60 text-slate-100 hover:bg-slate-600/70 transition-colors"
              title="Resetar layout automático"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Linha 2: Search + Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Procurar recurso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-md border border-slate-600 bg-slate-700/60 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
          />

          {/* Divider */}
          <div className="hidden h-5 w-px bg-slate-700/50 lg:block" />

          {/* Filtros por tipo de recurso */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(NODE_COLORS)
              .filter(([type]) => type !== 'db-group')
              .map(([type, color]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleTypeFilter(type)}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-all ${
                    visibleTypes.has(type)
                      ? 'bg-slate-700/50 text-slate-200'
                      : 'opacity-40 text-slate-300 hover:opacity-60'
                  }`}
                  title={`${visibleTypes.has(type) ? 'Ocultar' : 'Mostrar'} ${NODE_LABELS[type] ?? type}`}
                >
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span>{NODE_LABELS[type] ?? type}</span>
                </button>
              ))}
          </div>

          {/* Divider */}
          <div className="hidden h-5 w-px bg-slate-700/50 lg:block" />

          {/* Grouping */}
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'none' | 'environment' | 'tag')}
            className="rounded-md border border-slate-600 bg-slate-700/60 px-2.5 py-1.5 text-xs text-slate-100 font-medium hover:bg-slate-600/70 focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
          >
            <option value="none">Sem agrupar</option>
            <option value="environment">Por ambiente</option>
            <option value="tag">Por tag</option>
          </select>
        </div>

        {/* Impact console — só aparece durante a simulação de parada */}
        {simulationSourceId && (
          <>
            <div className="mx-2 h-6 w-px bg-line" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wide">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-impact-source" />
                <span className="text-red-400">offline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-impact-direct" />
                <span className="text-orange-400">impacto direto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-impact-indirect" />
                <span className="text-amber-400">impacto indireto</span>
              </div>
            </div>
            <div className="ml-auto flex animate-console-in items-center gap-3 rounded-md border border-red-900/50 bg-red-950/40 px-3 py-1.5 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <span className="text-[11px] text-red-300">
                <span className="text-red-500">{'>'}</span> simulando parada — {impactedNodeIds.size} recurso{impactedNodeIds.size !== 1 ? 's' : ''} afetado{impactedNodeIds.size !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={handleImpactReset}
                className="text-[11px] text-slate-300 hover:text-slate-100 underline underline-offset-2"
              >
                encerrar
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Área principal: grafo + painel inferior ──────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Grafo — largura total */}
        <div ref={graphContainerRef} className="flex-1 overflow-hidden bg-canvas">
          <Suspense fallback={<div className="flex items-center justify-center h-full"><Spinner /></div>}>
            {visualizationMode === 'flow' && data ? (
              <DependencyGraphVizualizer
                nodes={data.nodes}
                edges={data.edges}
                rootNodeId={selectedNodeId || undefined}
              />
            ) : (
              <ResourceGraph
                nodes={graphNodes}
                edges={graphEdges}
                mode="overview"
                impactedNodeIds={impactedNodeIds}
                impactedByDepth={impactedByDepth}
                simulationSourceId={simulationSourceId}
                highlightedNodeIds={highlightedNodeIds}
                onNodeSelect={editMode ? undefined : handleNodeSelect}
                onNodeNavigate={editMode ? undefined : handleNodeNavigate}
                isLoading={isLoading}
                editMode={editMode}
                compactMode={compactMode}
                onConnect={handleConnect}
                onEdgeDelete={handleEdgeDelete}
                storageKey="ecosystem-graph-positions"
                resetLayoutKey={resetLayoutKey}
              />
            )}
          </Suspense>
        </div>

        {/* Painel flutuante do nó selecionado — canto direito */}
        {selectedNode && (
          <div className="absolute right-3 top-3 z-10 flex w-64 flex-col gap-3 rounded-lg border border-slate-600 bg-slate-900/95 p-4 shadow-xl backdrop-blur">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-100 text-sm leading-tight">{selectedNode.label}</h3>
                <Badge tone="default" className="mt-1 inline-block text-xs">
                  {selectedNode.resourceType}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-400 hover:text-slate-100 mt-0.5 text-sm leading-none"
              >
                ✕
              </button>
            </div>

            {(selectedNode.status || selectedNode.environment) && (
              <dl className="flex flex-col gap-1 text-xs border-t border-slate-600 pt-2">
                {selectedNode.status && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Status</dt>
                    <dd className="text-slate-200">{selectedNode.status}</dd>
                  </div>
                )}
                {selectedNode.environment && (
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Ambiente</dt>
                    <dd className="text-slate-200">{selectedNode.environment}</dd>
                  </div>
                )}
              </dl>
            )}

            {selectedNode.resourceType === 'db-group' && selectedNode.dbLabels && (
              <ul className="flex flex-col gap-0.5 text-xs border-t border-slate-600 pt-2">
                {selectedNode.dbLabels.map((name, i) => (
                  <li key={i} className="text-slate-100">• {name}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2 border-t border-slate-600 pt-2">
              {(selectedNode.resourceType !== 'db-group' || curatedGroupIdFromNodeId(selectedNode.id)) && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleNodeNavigate(selectedNode.id, selectedNode.resourceType)}
                >
                  Ver Detalhes
                </Button>
              )}

              {selectedNodeId && selectedNodeType && selectedNode.resourceType !== 'db-group' && (
                <ImpactAnalysisPanel
                  resourceType={selectedNodeType}
                  resourceId={selectedNodeId}
                  resourceLabel={selectedNode.label ?? selectedNodeId}
                  onResult={handleImpactResult}
                  onReset={handleImpactReset}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {pendingConn && (
        <ConnectionModal
          pending={pendingConn}
          isBusy={createRel.isPending}
          onConfirm={handleConfirmConnect}
          onCancel={() => setPendingConn(null)}
          error={connectionError}
        />
      )}
    </div>
  );
}
