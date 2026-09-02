import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useBulkDeleteUrls } from '../features/urls/use-bulk-delete-urls';
import { useUrls } from '../features/urls/use-urls';
import type { Url } from '../features/urls/use-urls';
import { UrlFormDialog } from '../features/urls/UrlFormDialog';
import { UrlImportDialog } from '../features/urls/UrlImportDialog';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { CopyIcon, PencilIcon, PlusIcon, TrashIcon, UploadIcon } from '../shared/components/icons';
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
  const bulkDelete = useBulkDeleteUrls();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editing, setEditing] = useState<Url | null>(null);
  const [duplicating, setDuplicating] = useState<Url | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data?.items ?? [];
  const selectedItems = items.filter((u) => selectedIds.has(u.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = items.length > 0 && items.every((u) => selectedIds.has(u.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((u) => u.id)));
    }
  }

  function toggleOne(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreate(): void {
    setEditing(null);
    setDuplicating(null);
    setIsFormOpen(true);
  }

  function openEdit(url: Url): void {
    setEditing(url);
    setDuplicating(null);
    setIsFormOpen(true);
  }

  function openDuplicate(url: Url): void {
    setEditing(null);
    setDuplicating(url);
    setIsFormOpen(true);
  }

  function closeForm(): void {
    setIsFormOpen(false);
    setEditing(null);
    setDuplicating(null);
    setSelectedIds(new Set());
  }

  async function handleConfirmDelete(): Promise<void> {
    if (selectedItems.length === 0) return;
    await bulkDelete.mutateAsync(selectedItems.map((u) => u.id));
    setSelectedIds(new Set());
    setConfirmDeleteOpen(false);
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    bulkDelete.reset();
  }

  const deleteLabel = selectedItems.length > 1 ? `Eliminar (${selectedItems.length})` : 'Eliminar';
  const deleteMessage =
    selectedItems.length === 1
      ? `Tem certeza que deseja eliminar a URL "${singleSelected?.label}"? Esta acao nao pode ser desfeita.`
      : `Tem certeza que deseja eliminar ${selectedItems.length} URLs? Esta acao nao pode ser desfeita.`;

  return (
    <div>
      <PageHeader
        title="URLs e Endpoints"
        description="Gerencie URLs, endpoints e webhooks dos seus recursos"
      />

      <UrlFormDialog isOpen={isFormOpen} onClose={closeForm} url={editing} prefill={duplicating} />
      <UrlImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar URL"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={bulkDelete.isPending}
        error={bulkDelete.isError ? (bulkDelete.error?.message ?? 'Erro ao eliminar') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-line bg-surface/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir URL
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<UploadIcon />}
          onClick={() => setIsImportOpen(true)}
          title="Importar URLs em massa a partir de arquivo CSV"
        >
          Importar
        </Button>
        <div className="mx-1 h-6 w-px bg-surface-raised" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openEdit(singleSelected)}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openDuplicate(singleSelected)}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={selectedItems.length === 0 || bulkDelete.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedItems.length > 0
            ? selectedItems.length === 1
              ? `Selecionado: ${singleSelected?.label}`
              : `${selectedItems.length} URLs selecionadas`
            : 'Selecione URLs para editar ou eliminar.'}
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
        <div className="overflow-x-auto rounded border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface/60">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-signal"
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Código</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">URL</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Healthcheck</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((url) => {
                const isSelected = selectedIds.has(url.id);
                return (
                  <tr
                    key={url.id}
                    onClick={() => toggleOne(url.id)}
                    className={`cursor-pointer border-b border-line/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-signal/10' : 'hover:bg-surface/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(url.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${url.label}`}
                        className="h-4 w-4 accent-signal"
                      />
                    </td>
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
                        className="font-mono text-xs hover:text-signal"
                      >
                        {url.url}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="default">{url.urlType}</Badge>
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
