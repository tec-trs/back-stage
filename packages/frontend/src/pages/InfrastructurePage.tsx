import { useCatalogEntities } from '../features/catalog-entities/use-catalog-entities';
import { Badge } from '../shared/components/Badge';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

export function InfrastructurePage() {
  const { data, isLoading, isError, error } = useCatalogEntities('resource');

  return (
    <div>
      <PageHeader
        title="Catalogo de Infraestrutura"
        description="Recursos de infraestrutura registrados (bancos, filas, clusters)"
      />

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar infraestrutura'}
        />
      )}
      {data && data.items.length === 0 && (
        <EmptyState
          title="Nenhum recurso de infraestrutura"
          description="Cadastre recursos via API para comecar."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((resource) => (
            <div key={resource.id} className="rounded-lg border border-slate-800 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-100">{resource.title ?? resource.name}</p>
                <Badge>{resource.type}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {resource.description ?? 'Sem descricao.'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
