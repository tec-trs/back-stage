import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import { useFullGraph } from '../features/resource-graph/use-resource-graph';
import type { GraphNode, ImpactResult } from '../features/resource-graph/use-resource-graph';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { ResourceGraph } from '../shared/components/ResourceGraph';
import { Spinner } from '../shared/components/Spinner';

type ResourceType = 'server' | 'application' | 'database' | 'url';

const VALID_RESOURCE_TYPES = new Set<string>(['server', 'application', 'database', 'url']);

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
};

const NODE_LABELS: Record<string, string> = {
  server:      'Servidor',
  application: 'Aplicacao',
  database:    'Banco de Dados',
  'db-group':  'Bancos (agrupado)',
  url:         'URL',
};

export function EcosystemPage() {
  const { data, isLoading, isError, error } = useFullGraph({ page: 1, pageSize: 500 });
  const navigate = useNavigate();

  const [selectedNodeId,   setSelectedNodeId]   = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<ResourceType | null>(null);

  // Simulation state — kept here so the graph reflects the blast radius
  const [simulationSourceId, setSimulationSourceId] = useState<string | undefined>(undefined);
  const [impactedByDepth,    setImpactedByDepth]    = useState<Map<string, number>>(new Map());

  const impactedNodeIds = useMemo(() => new Set(impactedByDepth.keys()), [impactedByDepth]);

  // ── Opção A: agrupar bancos quando aplicação tem ≥ 2 ──────────────────────
  const { graphNodes, graphEdges, dbGroups } = useMemo(() => {
    if (!data) return { graphNodes: [], graphEdges: [], dbGroups: [] };

    // Mapa appId → edges de banco (sourceId=app, targetId=db)
    const appDbEdgeMap = new Map<string, typeof data.edges>();
    for (const edge of data.edges) {
      const src = data.nodes.find((n) => n.id === edge.sourceId);
      const tgt = data.nodes.find((n) => n.id === edge.targetId);
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
        const n = data.nodes.find((nn) => nn.id === id);
        return n?.label ?? id;
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

    return {
      graphNodes: [
        ...(data.nodes.filter((n) => !hiddenNodeIds.has(n.id)) as EcoNode[]),
        ...syntheticNodes,
      ] as EcoNode[],
      graphEdges: [
        ...data.edges.filter((e) => !hiddenEdgeIds.has(e.id)),
        ...syntheticEdges,
      ],
      dbGroups: groups,
    };
  }, [data]);

  const selectedNode = graphNodes.find((n) => n.id === selectedNodeId);

  const handleNodeSelect = useCallback((nodeId: string, resourceType: string) => {
    setSelectedNodeId(nodeId);
    if (VALID_RESOURCE_TYPES.has(resourceType)) setSelectedNodeType(resourceType as ResourceType);
  }, []);

  const handleNodeNavigate = useCallback(
    (nodeId: string, resourceType: string) => {
      if (resourceType === 'db-group') return; // grupo virtual — sem pagina de detalhe
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

  return (
    <div className="-mx-6 -mt-6 flex flex-col" style={{ height: 'calc(100vh - 61px)' }}>
      {/* ── Cabeçalho compacto com legenda horizontal ──────────────── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-slate-800 bg-slate-900/60 px-4 py-2">
        <div className="shrink-0">
          <h1 className="text-sm font-semibold text-slate-100">Ecossistema</h1>
          <p className="text-xs text-slate-500">Duplo clique no nó para abrir detalhes</p>
        </div>

        <div className="mx-2 hidden h-6 w-px bg-slate-700 lg:block" />

        {/* Legenda tipos de recurso */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs text-slate-400">{NODE_LABELS[type] ?? type}</span>
            </div>
          ))}
        </div>

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
        <div className="flex-1 overflow-hidden bg-slate-950">
          <ResourceGraph
            nodes={graphNodes}
            edges={graphEdges}
            mode="overview"
            impactedNodeIds={impactedNodeIds}
            impactedByDepth={impactedByDepth}
            simulationSourceId={simulationSourceId}
            onNodeSelect={handleNodeSelect}
            onNodeNavigate={handleNodeNavigate}
            isLoading={isLoading}
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
    </div>
  );
}
