import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import {
  useCreateRelationship,
  useDeleteRelationship,
  useFullGraph,
} from '../features/resource-graph/use-resource-graph';
import type { GraphNode, ImpactResult } from '../features/resource-graph/use-resource-graph';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { Modal } from '../shared/components/Modal';
import { PageHeader } from '../shared/components/PageHeader';
import { ResourceGraph } from '../shared/components/ResourceGraph';
import type { ConnPayload } from '../shared/components/ResourceGraph';
import { Spinner } from '../shared/components/Spinner';

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
        <div className="rounded-md border border-slate-700 bg-slate-800/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Relacionamento</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-slate-100">{sourceLabel}</span>
              <span className="text-slate-500">→</span>
              <span className="font-medium text-slate-100">{targetLabel}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsInverted(!isInverted)}
              className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
              title="Inverter direção"
            >
              ⇄
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Clique ⇄ para inverter a direção se necessário</p>
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-xs font-medium text-slate-400">Tipo de relacao</legend>
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
                <p className="text-xs text-slate-500">{opt.hint}</p>
              </div>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-400">Motivo (opcional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: X precisa acessar Y para autenticação"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-slate-500 focus:outline-none resize-none"
            rows={2}
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-800 pt-3">
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

export function EcosystemPage() {
  const { data, isLoading, isError, error } = useFullGraph({ page: 1, pageSize: 500 });
  const navigate = useNavigate();


  const [selectedNodeId,   setSelectedNodeId]   = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<ResourceType | null>(null);

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
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<Set<string>>(new Set());

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
      console.log('[EcosystemPage] Número de nós mudou, resetando layout:', {
        anterior: prevNodeCountRef.current,
        novo: data.nodes.length,
      });
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
        backgroundColor: '#1a1a2e',
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
        backgroundColor: '#1a1a2e',
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

  // Search functionality
  useEffect(() => {
    if (!searchTerm.trim() || !data) {
      setHighlightedNodeIds(new Set());
      return;
    }

    const term = searchTerm.toLowerCase();
    const matches = new Set<string>();
    for (const node of data.nodes) {
      if (node.label.toLowerCase().includes(term) || node.id.toLowerCase().includes(term)) {
        matches.add(node.id);
      }
    }
    setHighlightedNodeIds(matches);
  }, [searchTerm, data]);

  // ── Opção A: agrupar bancos quando aplicação tem ≥ 2 ──────────────────────
  const { graphNodes, graphEdges, dbGroups } = useMemo(() => {
    if (!data) return { graphNodes: [], graphEdges: [], dbGroups: [] };


    // Mapa appId → edges de banco (sourceId=app, targetId=db)
    const appDbEdgeMap = new Map<string, typeof data.edges>();
    for (const edge of data.edges) {
      const src = data.nodes.find((s) => s.id === edge.sourceId);
      const tgt = data.nodes.find((t) => t.id === edge.targetId);
      if (src?.resourceType === 'application' && tgt?.resourceType === 'database') {
        if (!appDbEdgeMap.has(edge.sourceId)) appDbEdgeMap.set(edge.sourceId, []);
        appDbEdgeMap.get(edge.sourceId)!.push(edge);
      }
    }

    const groups: DbGroup[] = [];
    const hiddenNodeIds = new Set<string>();
    const hiddenEdgeIds = new Set<string>();
    const syntheticNodes: EcoNode[] = [];
    const syntheticEdges: typeof data.edges = [];

    for (const [appId, dbEdges] of appDbEdgeMap) {
      if (dbEdges.length < 2) continue;

      const groupId = `db-group-${appId}`;
      const dbIds = dbEdges.map((e) => e.targetId);
      const dbLabels = dbIds.map((id) => {
        const node = data.nodes.find((nn) => nn.id === id);
        return node?.label ?? id;
      });

      groups.push({ id: groupId, dbIds, dbLabels });

      syntheticNodes.push({
        id: groupId,
        resourceType: 'db-group',
        label: `${dbEdges.length} bancos`,
        dbLabels,
      });

      syntheticEdges.push({
        id: `edge-${appId}-${groupId}`,
        sourceType: 'application',
        sourceId: appId,
        targetType: 'db-group',
        targetId: groupId,
        relationType: 'connects_to',
      });

      for (const id of dbIds) hiddenNodeIds.add(id);
      for (const e of dbEdges) hiddenEdgeIds.add(e.id);
    }

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
  }, [data, visibleTypes, groupBy]);

  const selectedNode = graphNodes.find((n) => n.id === selectedNodeId);

  const handleNodeSelect = useCallback((nodeId: string, resourceType: string) => {
    if (resourceType === 'server-group') return; // container visual — sem painel
    setSelectedNodeId(nodeId);
    if (VALID_RESOURCE_TYPES.has(resourceType)) setSelectedNodeType(resourceType as ResourceType);
  }, []);

  const handleNodeNavigate = useCallback(
    (nodeId: string, resourceType: string) => {
      if (resourceType === 'db-group' || resourceType === 'server-group') return;
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
      {/* ── Cabeçalho compacto com legenda horizontal ──────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2">
        <div className="shrink-0 flex-1">
          <h1 className="text-sm font-semibold text-slate-100">Ecossistema</h1>
          <p className="text-xs text-slate-500">
            {editMode
              ? 'Arraste da bolinha azul de um nó até outro · clique × na aresta para remover'
              : 'Duplo clique no nó para abrir detalhes'}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/relationships"
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            📋 Ver todas as relações
          </a>
          <a
            href="/risk-analysis"
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            ⚠️ Análise de Risco
          </a>
        </div>

        {/* Modo compacto */}
        <button
          type="button"
          onClick={() => setCompactMode((prev: boolean) => !prev)}
          className={`shrink-0 rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
            compactMode
              ? 'border-purple-700 bg-purple-900/40 text-purple-300 hover:bg-purple-900/60'
              : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          title={compactMode ? 'Modo compacto ativado · nós menores e labels reduzidos' : 'Modo expandido'}
        >
          {compactMode ? '⊡ Compacto' : '⊞ Expandido'}
        </button>

        <button
          type="button"
          onClick={() => setEditMode((prev) => {
            if (!prev) setSelectedNodeId(null);
            return !prev;
          })}
          className={`shrink-0 rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
            editMode
              ? 'border-blue-700 bg-blue-900/40 text-blue-300 hover:bg-blue-900/60'
              : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {editMode ? 'Sair da edicao' : 'Editar relacoes'}
        </button>

        <button
          type="button"
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="shrink-0 rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 relative"
          title="Exportar gráfico como imagem ou PDF"
        >
          📥 Exportar
        </button>

        {showExportMenu && (
          <div className="absolute top-full mt-1 rounded-md border border-slate-700 bg-slate-800 shadow-lg z-20">
            <button
              type="button"
              onClick={() => handleExportPNG()}
              className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              📷 Exportar como PNG
            </button>
            <button
              type="button"
              onClick={() => handleExportPDF()}
              className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors border-t border-slate-700"
            >
              📄 Exportar como PDF
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setResetLayoutKey((k) => k + 1)}
          className="shrink-0 rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
          title="Desfaz posicionamento manual e recalcula o layout automatico"
        >
          Resetar layout
        </button>

        <div className="mx-2 hidden h-6 w-px bg-slate-700 lg:block" />

        {/* Search */}
        <input
          type="text"
          placeholder="🔍 Procurar recurso..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shrink-0 rounded-md border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 placeholder-slate-500 focus:border-slate-600 focus:outline-none"
        />

        <div className="mx-2 hidden h-6 w-px bg-slate-700 lg:block" />

        {/* Filtros por tipo de recurso */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {Object.entries(NODE_COLORS)
            .filter(([type]) => type !== 'db-group')
            .map(([type, color]) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleTypeFilter(type)}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-all ${
                  visibleTypes.has(type)
                    ? 'bg-slate-700'
                    : 'opacity-40 hover:opacity-60'
                }`}
                title={`${visibleTypes.has(type) ? 'Ocultar' : 'Mostrar'} ${NODE_LABELS[type] ?? type}`}
              >
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-slate-300">{NODE_LABELS[type] ?? type}</span>
              </button>
            ))}
        </div>

        <div className="mx-2 hidden h-6 w-px bg-slate-700 lg:block" />

        {/* Grouping */}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as 'none' | 'environment' | 'tag')}
          className="shrink-0 rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-slate-600 focus:outline-none"
        >
          <option value="none">Sem agrupar</option>
          <option value="environment">Agrupar por ambiente</option>
          <option value="tag">Agrupar por tag</option>
        </select>

        {/* Legenda impacto — só aparece em modo simulação */}
        {simulationSourceId && (
          <>
            <div className="mx-2 h-6 w-px bg-slate-700" />
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                <span className="text-xs text-red-400">Offline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-orange-500" />
                <span className="text-xs text-orange-400">Impacto direto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
                <span className="text-xs text-amber-400">Impacto indireto</span>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-3 rounded-md border border-red-900/50 bg-red-950/30 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-300 font-medium">
                Simulacao ativa — {impactedNodeIds.size} afetado{impactedNodeIds.size !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={handleImpactReset}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Encerrar
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Área principal: grafo + painel inferior ──────────────────── */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Grafo — largura total */}
        <div ref={graphContainerRef} className="flex-1 overflow-hidden bg-slate-950">
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
        </div>

        {/* Painel flutuante do nó selecionado — canto direito */}
        {selectedNode && (
          <div className="absolute right-3 top-3 z-10 flex w-64 flex-col gap-3 rounded-lg border border-slate-700 bg-slate-900/95 p-4 shadow-xl backdrop-blur">
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
                className="text-slate-500 hover:text-slate-300 mt-0.5 text-sm leading-none"
              >
                ✕
              </button>
            </div>

            {(selectedNode.status || selectedNode.environment) && (
              <dl className="flex flex-col gap-1 text-xs border-t border-slate-800 pt-2">
                {selectedNode.status && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Status</dt>
                    <dd className="text-slate-200">{selectedNode.status}</dd>
                  </div>
                )}
                {selectedNode.environment && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Ambiente</dt>
                    <dd className="text-slate-200">{selectedNode.environment}</dd>
                  </div>
                )}
              </dl>
            )}

            {selectedNode.resourceType === 'db-group' && selectedNode.dbLabels && (
              <ul className="flex flex-col gap-0.5 text-xs border-t border-slate-800 pt-2">
                {selectedNode.dbLabels.map((name, i) => (
                  <li key={i} className="text-slate-300">• {name}</li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2 border-t border-slate-800 pt-2">
              {selectedNode.resourceType !== 'db-group' && (
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
