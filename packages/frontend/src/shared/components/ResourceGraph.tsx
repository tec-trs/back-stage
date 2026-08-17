import React from 'react';

interface ResourceGraphProps {
  nodes: Array<{
    id: string;
    resourceType: 'server' | 'application' | 'database' | 'url';
    label: string;
    status?: string;
    criticality?: string;
  }>;
  edges: Array<{
    id: string;
    sourceType: string;
    sourceId: string;
    targetType: string;
    targetId: string;
    relationType: string;
  }>;
  mode?: 'overview' | 'subgraph' | 'impact';
  impactedNodeIds?: Set<string>;
  onNodeSelect?: (nodeId: string, resourceType: string) => void;
  onNodeNavigate?: (nodeId: string, resourceType: string) => void;
  isLoading?: boolean;
}

export const ResourceGraph: React.FC<ResourceGraphProps> = ({
  nodes: propsNodes,
  edges: propsEdges,
  mode: _mode,
  impactedNodeIds: _impactedNodeIds,
  onNodeSelect: _onNodeSelect,
  onNodeNavigate,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Carregando grafo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-800 rounded-lg p-6 text-center">
      <div className="text-slate-400">
        <h3 className="text-lg font-semibold mb-4">Grafo de Dependências</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-700 rounded">
              <div className="text-2xl font-bold text-slate-100">{propsNodes.length}</div>
              <div className="text-sm text-slate-400">Recursos</div>
            </div>
            <div className="p-4 bg-slate-700 rounded">
              <div className="text-2xl font-bold text-slate-100">{propsEdges.length}</div>
              <div className="text-sm text-slate-400">Relacionamentos</div>
            </div>
          </div>

          {propsNodes.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2 text-slate-200">Recursos encontrados:</h4>
              <div className="space-y-1 text-left">
                {propsNodes.map((node) => (
                  <div
                    key={node.id}
                    onClick={() => onNodeNavigate?.(node.id, node.resourceType)}
                    className="p-2 bg-slate-700 rounded cursor-pointer hover:bg-slate-600 transition text-sm"
                  >
                    <span className="font-medium text-slate-100">{node.label}</span>
                    <span className="text-xs text-slate-400 ml-2">({node.resourceType})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-xs text-slate-500">
            ℹ️ Visualizador gráfico em desenvolvimento
          </div>
        </div>
      </div>
    </div>
  );
};
