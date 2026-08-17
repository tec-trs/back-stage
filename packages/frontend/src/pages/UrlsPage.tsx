import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useDeleteUrl } from '../features/urls/use-delete-url';
import { useUrls } from '../features/urls/use-urls';
import type { Url } from '../features/urls/use-urls';
import { UrlFormDialog } from '../features/urls/UrlFormDialog';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, TrashIcon } from '../shared/components/icons';
import { exportToCsv } from '../shared/utils/export-csv';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  inactive: 'warning',
  deprecated: 'warning',
  error: 'danger',
};

const HEALTHCHECK_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  ok: 'success',
  error: 'danger',
  timeout: 'warning',
};

export function UrlsPage() {
  const { data, isLoading, isError, error } = useUrls({ page: 1, pageSize: 100 });
  const deleteUrl = useDeleteUrl();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Url | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data?.items ?? [];
  const selected = items.find((u) => u.id === selectedId) ?? null;

  function openCreate(): void {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEdit(url: Url): void {
    setEditing(url);
    setIsFormOpen(true);
  }

  function closeForm(): void {
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleConfirmDelete(): void {
    if (!selected) return;
    deleteUrl.mutate(selected.id, {
      onSuccess: () => {
        setSelectedId(null);
        setConfirmDeleteOpen(false);
      },
    });
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    deleteUrl.reset();
  }

  return (
    <div>
      <PageHeader
        title="URLs e Endpoints"
        description="Gerencie URLs, endpoints e webhooks dos seus recursos"
      />

      <UrlFormDialog isOpen={isFormOpen} onClose={closeForm} url={editing} />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar URL"
        message={`Tem certeza que deseja eliminar a URL "${selected?.label}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={deleteUrl.isPending}
        error={deleteUrl.isError ? (deleteUrl.error?.message ?? 'Erro ao eliminar') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir URL
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!selected}
          onClick={() => selected && openEdit(selected)}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selected || deleteUrl.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selected
            ? `Selecionado: ${selected.label}`
            : 'Selecione uma URL para editar ou eliminar.'}
        </span>
        <Button
          size="sm"
          variant="secondary"
          disabled={items.length === 0}
          onClick={() =>
            exportToCsv(
              'urls.csv',
              items.map((url) => ({
                Label: url.label,
                URL: url.url,
                Tipo: url.urlType,
                RecursoTipo: url.ownerResourceType,
                RecursoId: url.ownerResourceId,
                Healthcheck: url.healthcheckEnabled ? 'Sim' : 'Nao',
                UltimoCheck: url.lastCheckStatus ?? '',
                Status: url.status,
              })),
            )
          }
        >
          Exportar CSV
        </Button>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message={error?.message ?? 'Erro ao carregar URLs'} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhuma URL cadastrada"
          description="Cadastre a primeira URL para comecar a monitorar seus endpoints."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Label</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">URL</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Recurso</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Healthcheck</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((url) => {
                const isSelected = url.id === selectedId;
                return (
                  <tr
                    key={url.id}
                    onClick={() => setSelectedId(isSelected ? null : url.id)}
                    className={`cursor-pointer border-b border-slate-800/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-slate-800' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-100">
                      <Link
                        to={`/urls/${url.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {url.label}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-400">
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-mono text-xs hover:text-sky-400"
                      >
                        {url.url}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="default">{url.urlType}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <span className="capitalize">{url.ownerResourceType}</span>
                    </td>
                    <td className="px-4 py-3">
                      {url.healthcheckEnabled && url.lastCheckStatus ? (
                        <Badge tone={HEALTHCHECK_TONE[url.lastCheckStatus] ?? 'default'}>
                          {url.lastCheckStatus}
                        </Badge>
                      ) : url.healthcheckEnabled ? (
                        <span className="text-xs text-slate-500">pendente</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[url.status] ?? 'default'}>{url.status}</Badge>
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
