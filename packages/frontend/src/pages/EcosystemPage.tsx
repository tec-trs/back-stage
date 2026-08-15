import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { GraphNode } from '../features/dependency-graph/use-dependency-graph';
import { useEcosystemGraph } from '../features/ecosystem/use-ecosystem-graph';
import { DependencyGraph } from '../shared/components/DependencyGraph';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

export function EcosystemPage() {
  const { data, isLoading, isError, error } = useEcosystemGraph();
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleNodeNavigate = useCallback(
    (node: GraphNode) => {
      if (node.kind === 'server') {
        navigate(`/servers/${node.id}`);
      } else if (node.kind === 'application') {
        navigate(`/applications/${node.id}`);
      }
    },
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title="Ecossistema"
        description="Servidores, aplicacoes e seus relacionamentos (hospeda / depende de)"
      />

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar grafo'} />
      )}

      {data && (
        <>
          <div className="mb-3 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#22d3ee]" /> Servidor
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#a3e635]" /> Aplicacao
            </span>
            {selectedNode && (
              <span className="ml-auto text-slate-500">
                Selecionado: {selectedNode.title ?? selectedNode.name} ({selectedNode.kind}) — duplo
                clique para navegar
              </span>
            )}
          </div>
          <DependencyGraph
            nodes={data.nodes}
            edges={data.edges}
            selectedNodeId={selectedNode?.id ?? null}
            onNodeSelect={setSelectedNode}
            onNodeNavigate={handleNodeNavigate}
            ariaLabel="Grafo do ecossistema de servidores e aplicacoes"
          />
        </>
      )}
    </div>
  );
}
