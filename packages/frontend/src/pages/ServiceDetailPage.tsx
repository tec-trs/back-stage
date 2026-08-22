import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  useDependencyGraph,
  type GraphNode,
} from '../features/dependency-graph/use-dependency-graph';
import { useService } from '../features/services/use-service';
import { Badge } from '../shared/components/Badge';
import { DependencyGraph } from '../shared/components/DependencyGraph';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { NotFoundError } from '../shared/components/NotFoundError';
import { Spinner } from '../shared/components/Spinner';
import { translateLifecycle } from '../shared/constants/labels';

export function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useService(id);
  const graph = useDependencyGraph();
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleNodeNavigate = useCallback(
    (node: GraphNode) => {
      if (node.kind === 'component') {
        navigate(`/catalog/${node.id}`);
      }
    },
    [navigate],
  );

  return (
    <div>
      <Link to="/catalog" className="text-sm text-slate-400 hover:underline">
        &larr; Voltar ao catalogo
      </Link>

      {isLoading && <Spinner />}
      {isError && <NotFoundError resourceType="serviço" backLink="/catalog" backLabel="Voltar ao catálogo" />}

      {data && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-100">{data.title ?? data.name}</h1>
            <Badge>{translateLifecycle(data.lifecycle)}</Badge>
          </div>
          <p className="mt-2 text-slate-400">{data.description ?? 'Sem descrição.'}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-slate-800 p-4 text-sm">
            <dt className="text-slate-500">Nome</dt>
            <dd>{data.name}</dd>
            <dt className="text-slate-500">Tipo</dt>
            <dd>{data.type}</dd>
            <dt className="text-slate-500">Namespace</dt>
            <dd>{data.namespace}</dd>
            <dt className="text-slate-500">Repositorio</dt>
            <dd>
              {data.repositoryUrl ? (
                <a
                  href={data.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:underline"
                >
                  {data.repositoryUrl}
                </a>
              ) : (
                '-'
              )}
            </dd>
          </dl>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-200">Grafo de dependencias</h2>
              {selectedNode && (
                <span className="text-xs text-slate-500">
                  Selecionado: {selectedNode.title ?? selectedNode.name} ({selectedNode.kind}) —
                  duplo clique para navegar
                </span>
              )}
            </div>

            {graph.isLoading && <Spinner />}
            {graph.isError && (
              <ErrorMessage
                message={
                  graph.error instanceof Error ? graph.error.message : 'Erro ao carregar grafo'
                }
              />
            )}
            {graph.data && (
              <DependencyGraph
                nodes={graph.data.nodes}
                edges={graph.data.edges}
                selectedNodeId={selectedNode?.id ?? id ?? null}
                onNodeSelect={setSelectedNode}
                onNodeNavigate={handleNodeNavigate}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
