import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useFullGraph, useSimulateImpact } from '../features/resource-graph/use-resource-graph.js';
import { Badge } from '../shared/components/Badge.js';
import { Button } from '../shared/components/Button.js';
import { ErrorMessage } from '../shared/components/ErrorMessage.js';
import { PageHeader } from '../shared/components/PageHeader.js';
import { ResourceGraph } from '../shared/components/ResourceGraph.js';
import { Spinner } from '../shared/components/Spinner.js';

export function EcosystemPage() {
  const { data, isLoading, isError, error } = useFullGraph({
    page: 1,
    pageSize: 500,
  });
  const navigate = useNavigate();
  const simulateImpact = useSimulateImpact();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [showImpact, setShowImpact] = useState(false);
  const [impactData, setImpactData] = useState<any>(null);

  const selectedNode = data?.nodes.find((n) => n.id === selectedNodeId);

  const handleNodeSelect = useCallback((nodeId: string, resourceType: string) => {
    setSelectedNodeId(nodeId);
    setSelectedNodeType(resourceType);
    setShowImpact(false);
  }, []);

  const handleNodeNavigate = useCallback(
    (nodeId: string, resourceType: string) => {
      const pathMap: Record<string, string> = {
        server: 'servers',
        application: 'applications',
        database: 'databases',
        url: 'urls',
      };
      const path = pathMap[resourceType] || resourceType + 's';
      navigate(`/${path}/${nodeId}`);
    },
    [navigate],
  );

  const handleSimulateImpact = async () => {
    if (!selectedNodeId || !selectedNodeType) return;
    try {
      const result = await simulateImpact.mutateAsync({
        resourceType: selectedNodeType as any,
        resourceId: selectedNodeId,
      });
      setImpactData(result);
      setShowImpact(true);
    } catch (err) {
      console.error('Erro ao simular impacto:', err);
    }
  };

  const impactedNodeIds = impactData
    ? new Set(impactData.impactedResources.map((r: any) => r.resourceId)) as Set<string>
    : new Set();

  if (isError) return <ErrorMessage message={error instanceof Error ? error.message : "Erro ao carregar ecosistema"} />;
  if (isLoading) return <Spinner />;
  if (!data || data.nodes.length === 0) {
    return (
      <div>
        <PageHeader
          title="Ecossistema"
          description="Grafo completo de recursos: servidores, aplicações, bancos de dados e URLs"
        />
        <ErrorMessage message="Nenhum recurso encontrado. Comece adicionando servidores ou aplicações." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ecossistema"
        description="Grafo completo de recursos: servidores, aplicações, bancos de dados e URLs"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow h-[600px] overflow-hidden">
            <ResourceGraph
              nodes={data.nodes}
              edges={data.edges}
              mode={showImpact ? 'impact' : 'overview'}
              impactedNodeIds={impactedNodeIds}
              onNodeSelect={handleNodeSelect}
              onNodeNavigate={handleNodeNavigate}
              isLoading={isLoading}
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Legenda</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                <span>Servidor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#8b5cf6' }}></div>
                <span>Aplicação</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ec4899' }}></div>
                <span>Banco de Dados</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
                <span>URL</span>
              </div>
            </div>
          </div>

          {selectedNode && (
            <div className="bg-white rounded-lg shadow p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-gray-800">{selectedNode.label}</h3>
                <Badge tone="default" className="inline-block mt-1">
                  {selectedNode.resourceType}
                </Badge>
              </div>

              <div className="text-sm space-y-2">
                {selectedNode.status && (
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium">{selectedNode.status}</p>
                  </div>
                )}
                {selectedNode.environment && (
                  <div>
                    <span className="text-gray-600">Ambiente:</span>
                    <p className="font-medium">{selectedNode.environment}</p>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full"
                onClick={handleSimulateImpact}
                disabled={simulateImpact.isPending}
              >
                {simulateImpact.isPending ? 'Simulando...' : 'Simular Impacto'}
              </Button>

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

          {showImpact && impactData && (
            <div className="bg-red-50 rounded-lg shadow p-4 space-y-3 border border-red-200">
              <h3 className="font-semibold text-red-900">Análise de Impacto</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-red-700">Total Afetado:</span>
                  <p className="font-bold text-lg text-red-900">{impactData.totalImpacted}</p>
                </div>
                <div className="border-t border-red-200 pt-2">
                  {Object.entries(impactData.byType).map(([type, count]: any) => (
                    count > 0 && (
                      <div key={type}>
                        <span className="text-red-700 capitalize">{type}:</span>
                        <p className="font-medium text-red-900">{count}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
