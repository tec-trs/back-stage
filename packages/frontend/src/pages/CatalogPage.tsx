import { useState } from 'react';
import { Link } from 'react-router-dom';

import { CreateServiceDialog } from '../features/services/CreateServiceDialog';
import { useServices } from '../features/services/use-services';
import { Badge } from '../shared/components/Badge';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import { translateLifecycle } from '../shared/constants/labels';

const LIFECYCLE_TONE = {
  production: 'success',
  experimental: 'warning',
  deprecated: 'danger',
} as const;

export function CatalogPage() {
  const { data, isLoading, isError, error } = useServices();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Catalogo de Servicos"
        description="Servicos registrados na plataforma"
        actions={
          <button
            type="button"
            onClick={() => setIsCreateDialogOpen(true)}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
          >
            + Novo Servico
          </button>
        }
      />

      <CreateServiceDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar servicos'}
        />
      )}
      {data && data.items.length === 0 && (
        <EmptyState
          title="Nenhum servico encontrado"
          description="Cadastre um servico via API para comecar."
        />
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Ciclo de vida</th>
                <th className="px-4 py-2 font-medium">Namespace</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((service) => (
                <tr key={service.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                  <td className="px-4 py-2">
                    <Link to={`/catalog/${service.id}`} className="text-slate-100 hover:underline">
                      {service.title ?? service.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{service.type}</td>
                  <td className="px-4 py-2">
                    <Badge
                      tone={
                        LIFECYCLE_TONE[service.lifecycle as keyof typeof LIFECYCLE_TONE] ??
                        'default'
                      }
                    >
                      {translateLifecycle(service.lifecycle)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{service.namespace}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
