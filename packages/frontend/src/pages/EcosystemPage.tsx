import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ImpactAnalysisPanel } from '../features/resource-graph/ImpactAnalysisPanel';
import { useFullGraph } from '../features/resource-graph/use-resource-graph';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { ResourceGraph } from '../shared/components/ResourceGraph';
import { Spinner } from '../shared/components/Spinner';

type ResourceType = 'server' | 'application' | 'database' | 'url';

const VALID_RESOURCE_TYPES = new Set<string>(['server', 'application', 'database', 'url']);

const NODE_COLORS: Record<string, string> = {
  server: '#3b82f6',
  application: '#8b5cf6',
  database: '#ec4899',
  url: '#f59e0b',
};

export function EcosystemPage() {
  const { data, isLoading, isError, error } = useFullGraph({ page: 1, pageSize: 500 });
  const navigate = useNavigate();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<ResourceType | null>(null);

  const selectedNode = data?.nodes.find((n) => n.id === selectedNodeId);

  const handleNodeSelect = useCallback((nodeId: string, resourceType: string) => {
    setSelectedNodeId(nodeId);
    if (VALID_RESOURCE_TYPES.has(resourceType)) setSelectedNodeType(resourceType as ResourceType);
  }, []);

  const handleNodeNavigate = useCallback(
    (nodeId: string, resourceType: string) => {
      const pathMap: Record<string, string> = {
        server: 'servers',
        application: 'applications',
        database: 'databases',
        url: 'urls',
      };
      navigate(`/${pathMap[resourceType] ?? resourceType + 's'}/${nodeId}`);
    },
    [navigate],
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

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ecossistema"
        description="Grafo completo de recursos: servidores, aplicacoes, bancos de dados e URLs"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div style={{ height: '600px' }} className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
            <ResourceGraph
              nodes={data.nodes}
              edges={data.edges}
              mode="overview"
              impactedNodeIds={new Set<string>()}
              onNodeSelect={handleNodeSelect}
              onNodeNavigate={handleNodeNavigate}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Legenda */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">Legenda</h3>
            <div className="flex flex-col gap-2 text-sm">
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded" style={{ backgroundColor: color }} />
                  <span className="capitalize text-slate-400">{type}</span>
                </div>
              ))}
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

          {/* Analise de impacto do node selecionado */}
          {selectedNodeId && selectedNodeType && (
            <ImpactAnalysisPanel
              resourceType={selectedNodeType}
              resourceId={selectedNodeId}
              resourceLabel={selectedNode?.label ?? selectedNodeId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
