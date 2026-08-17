import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import { useFullGraph } from '../features/resource-graph/use-resource-graph';
import type { ImpactResult } from '../features/resource-graph/use-resource-graph';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { ResourceGraph } from '../shared/components/ResourceGraph';
import { Spinner } from '../shared/components/Spinner';

type ResourceType = 'server' | 'application' | 'database' | 'url';

const VALID_RESOURCE_TYPES = new Set<string>(['server', 'application', 'database', 'url']);

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

  const selectedNode = graphNodes.find((n) => n.id === selectedNodeId);

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
    const syntheticNodes: typeof data.nodes = [];
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
        resourceType: 'db-group' as ResourceType,
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
        ...data.nodes.filter((n) => !hiddenNodeIds.has(n.id)),
        ...syntheticNodes,
      ],
      graphEdges: [
        ...data.edges.filter((e) => !hiddenEdgeIds.has(e.id)),
        ...syntheticEdges,
      ],
      dbGroups: groups,
    };
  }, [data]);

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
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ecossistema"
        description="Grafo completo de recursos: servidores, aplicacoes, bancos de dados e URLs"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* ── Grafo ────────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          {simulationSourceId && (
            <div className="mb-2 flex items-center gap-3 rounded-md border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="text-red-300 font-medium">Modo simulacao ativo</span>
              <span className="text-slate-400 flex-1">
                — {impactedNodeIds.size} recurso{impactedNodeIds.size !== 1 ? 's' : ''} afetado{impactedNodeIds.size !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={handleImpactReset}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Encerrar simulacao
              </button>
            </div>
          )}
          <div style={{ height: '600px' }} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
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
        </div>

        {/* ── Painel lateral ───────────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Legenda */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">Legenda</h3>
            <div className="flex flex-col gap-2 text-sm">
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
                  <span className="text-slate-400">{NODE_LABELS[type] ?? type}</span>
                </div>
              ))}
              {simulationSourceId && (
                <>
                  <div className="mt-2 border-t border-slate-800 pt-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-red-500" />
                      <span className="text-red-400 text-xs">Offline (simulado)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-orange-500" />
                      <span className="text-orange-400 text-xs">Impacto direto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-amber-500" />
                      <span className="text-amber-400 text-xs">Impacto indireto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded bg-slate-700 opacity-30" />
                      <span className="text-slate-600 text-xs">Sem impacto</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Node selecionado */}
          {selectedNode && (
            <div className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <div>
                <h3 className="font-semibold text-slate-100">{selectedNode.label}</h3>
                <Badge tone="default" className="mt-1 inline-block">
                  {selectedNode.resourceType}
                </Badge>
              </div>

              <dl className="flex flex-col gap-1 text-sm">
                {selectedNode.status && (
                  <>
                    <dt className="text-slate-500">Status</dt>
                    <dd className="text-slate-200">{selectedNode.status}</dd>
                  </>
                )}
                {selectedNode.environment && (
                  <>
                    <dt className="text-slate-500">Ambiente</dt>
                    <dd className="text-slate-200">{selectedNode.environment}</dd>
                  </>
                )}
              </dl>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => handleNodeNavigate(selectedNode.id, selectedNode.resourceType)}
              >
                Ver Detalhes
              </Button>
            </div>
          )}

          {/* Lista de bancos para nó db-group */}
          {selectedNode?.resourceType === 'db-group' && selectedNode.dbLabels && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-300">Bancos agrupados</h3>
              <ul className="flex flex-col gap-1">
                {selectedNode.dbLabels.map((name, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="text-pink-400">🗄</span>
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Analise de impacto */}
          {selectedNodeId && selectedNodeType && selectedNode?.resourceType !== 'db-group' && (
            <ImpactAnalysisPanel
              resourceType={selectedNodeType}
              resourceId={selectedNodeId}
              resourceLabel={selectedNode?.label ?? selectedNodeId}
              onResult={handleImpactResult}
              onReset={handleImpactReset}
            />
          )}
        </div>
      </div>
    </div>
  );
}
