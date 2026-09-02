import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAllRelationships, useDeleteRelationship, useFullGraph } from '../features/resource-graph/use-resource-graph';
import { AddRelationshipDialog } from '../features/resource-graph/AddRelationshipDialog';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const RELATION_TYPE_LABELS: Record<string, { label: string; hint: string }> = {
  hosts: { label: 'Hospeda', hint: 'A origem hospeda / executa o destino' },
  depends_on: { label: 'Depende de', hint: 'A origem depende do destino para funcionar' },
  connects_to: { label: 'Conecta a', hint: 'A origem faz chamadas ao destino' },
  exposes: { label: 'Expõe', hint: 'A origem expõe o destino publicamente' },
  consumes: { label: 'Consome', hint: 'A origem consome serviço do destino' },
  part_of: { label: 'Parte de', hint: 'A origem é parte do destino' },
};

export function RelationshipsPage() {
  const navigate = useNavigate();
  const { data: relationships, isLoading, isError, error } = useAllRelationships();
  const { data: graph } = useFullGraph({ pageSize: 500 });
  const deleteRel = useDeleteRelationship();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [relTypeFilter, setRelTypeFilter] = useState('');

  // Mapas para resolução de labels
  const nodeMap = useMemo(
    () =>
      new Map(
        (graph?.nodes ?? []).map((n) => [`${n.resourceType}:${n.id}`, n]),
      ),
    [graph],
  );

  // Filtragem
  const filtered = useMemo(() => {
    if (!relationships) return [];

    let result = [...relationships];

    // Filtro por tipo de relação
    if (relTypeFilter) {
      result = result.filter((r) => r.relationType === relTypeFilter);
    }

    // Filtro por busca textual (origem ou destino)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((r) => {
        const src = nodeMap.get(`${r.sourceType}:${r.sourceId}`);
        const tgt = nodeMap.get(`${r.targetType}:${r.targetId}`);
        const srcLabel = src?.label.toLowerCase() ?? r.sourceId.toLowerCase();
        const tgtLabel = tgt?.label.toLowerCase() ?? r.targetId.toLowerCase();
        return srcLabel.includes(term) || tgtLabel.includes(term);
      });
    }

    return result;
  }, [relationships, searchTerm, relTypeFilter, nodeMap]);

  const isImplicit = (id: string): boolean =>
    id.startsWith('deploy:') || id.startsWith('url-owner:') || id.startsWith('edge-');

  const getDisplayName = (
    relLabel?: string,
    fallbackLabel?: string,
    id?: string,
  ): { name: string; title: string } => {
    // Preferência: label da relação → label do nó → UUID
    if (relLabel) {
      return { name: relLabel, title: relLabel };
    }
    if (fallbackLabel) {
      return { name: fallbackLabel, title: fallbackLabel };
    }
    // Mostrar apenas os últimos 8 chars do UUID
    const shortId = id ? id.substring(id.length - 8) : 'N/A';
    return { name: shortId, title: id || 'Unknown' };
  };

  if (isError) {
    return (
      <>
        <PageHeader
          title="Relacionamentos"
          description="Todas as dependências entre recursos do sistema"
        />
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar relacionamentos'}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Relacionamentos"
          description="Todas as dependências entre recursos do sistema"
        />
        <Button onClick={() => setIsDialogOpen(true)}>+ Novo Relacionamento</Button>
      </div>

      <AddRelationshipDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />

      {/* Filtros */}
      <div className="flex flex-col gap-3 rounded border border-line bg-surface/30 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-400">Buscar por nome</label>
          <input
            type="text"
            placeholder="Procurar origem ou destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface-raised px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-600 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-slate-400">Tipo de relação</label>
          <select
            value={relTypeFilter}
            onChange={(e) => setRelTypeFilter(e.target.value)}
            className="mt-1 w-full rounded border border-line bg-surface-raised px-3 py-2 text-sm text-slate-100 focus:border-slate-600 focus:outline-none"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(RELATION_TYPE_LABELS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded border border-line p-8 text-center">
          <p className="text-slate-400">Nenhum relacionamento encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Origem</th>
                <th className="w-12 px-4 py-3 text-center">→</th>
                <th className="px-4 py-3 font-medium">Destino</th>
                <th className="px-4 py-3 font-medium">Tipo de Relação</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 font-medium">Criado por</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rel) => {
                const src = nodeMap.get(`${rel.sourceType}:${rel.sourceId}`);
                const tgt = nodeMap.get(`${rel.targetType}:${rel.targetId}`);
                const srcDisplay = getDisplayName(undefined, src?.label, rel.sourceId);
                const tgtDisplay = getDisplayName(undefined, tgt?.label, rel.targetId);
                const implicit = isImplicit(rel.id);
                const relLabel = RELATION_TYPE_LABELS[rel.relationType]?.label ?? rel.relationType;

                return (
                  <tr key={rel.id} className="border-t border-line hover:bg-surface-raised/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="default" className="text-xs capitalize">
                          {rel.sourceType}
                        </Badge>
                        <button
                          onClick={() =>
                            navigate(
                              `/${rel.sourceType === 'url' ? 'urls' : rel.sourceType + 's'}/${rel.sourceId}`,
                            )
                          }
                          className="text-signal hover:underline truncate"
                          title={srcDisplay.title}
                        >
                          {srcDisplay.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500">→</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="default" className="text-xs capitalize">
                          {rel.targetType}
                        </Badge>
                        <button
                          onClick={() =>
                            navigate(
                              `/${rel.targetType === 'url' ? 'urls' : rel.targetType + 's'}/${rel.targetId}`,
                            )
                          }
                          className="text-signal hover:underline truncate"
                          title={tgtDisplay.title}
                        >
                          {tgtDisplay.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300">{relLabel}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {rel.reason ? (
                        <span
                          className="text-slate-400 truncate"
                          title={rel.reason}
                        >
                          {rel.reason}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rel.createdByName ? (
                        <span className="text-slate-300">{rel.createdByName}</span>
                      ) : implicit ? (
                        <Badge tone="default" className="text-xs">
                          Automático
                        </Badge>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {rel.createdAt ? (
                        <span className="text-slate-500 text-xs">
                          {new Date(rel.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!implicit && (
                        <button
                          onClick={() => deleteRel.mutate(rel.id)}
                          disabled={deleteRel.isPending}
                          className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                          {deleteRel.isPending ? 'Excluindo...' : 'Excluir'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
