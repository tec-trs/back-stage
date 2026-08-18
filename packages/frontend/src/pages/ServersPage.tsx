import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ServerFormDialog } from '../features/servers/ServerFormDialog';
import { ServerImportDialog } from '../features/servers/ServerImportDialog';
import { useBulkDeleteServers } from '../features/servers/use-bulk-delete-servers';
import { useServers } from '../features/servers/use-servers';
import type { ServerSummary } from '../features/servers/use-servers';
import { useSetServerStatus } from '../features/servers/use-set-server-status';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { CopyIcon, PencilIcon, PlusIcon, PowerIcon, TrashIcon, UploadIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import {
  translateEnvironment,
  translateProvider,
  translateServerStatus,
  translateServerType,
} from '../shared/constants/labels';

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  maintenance: 'warning',
  provisioning: 'default',
  deactivated: 'danger',
};

export function ServersPage() {
  const { data, isLoading, isError, error } = useServers();
  const setServerStatus = useSetServerStatus();
  const bulkDelete = useBulkDeleteServers();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerSummary | null>(null);
  const [duplicatingServer, setDuplicatingServer] = useState<ServerSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data?.items ?? [];
  const selectedItems = items.filter((s) => selectedIds.has(s.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = items.length > 0 && items.every((s) => selectedIds.has(s.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((s) => s.id)));
    }
  }

  function toggleOne(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreateDialog(): void {
    setEditingServer(null);
    setIsFormOpen(true);
  }

  function openEditDialog(server: ServerSummary): void {
    setEditingServer(server);
    setIsFormOpen(true);
  }

  function openDuplicateDialog(server: ServerSummary): void {
    setEditingServer(null);
    setDuplicatingServer(server);
    setIsFormOpen(true);
  }

  function closeDialog(): void {
    setIsFormOpen(false);
    setEditingServer(null);
    setDuplicatingServer(null);
  }

  function handleToggleStatusSelected(): void {
    if (singleSelected) {
      setServerStatus.mutate({
        id: singleSelected.id,
        status: singleSelected.status === 'deactivated' ? 'active' : 'deactivated',
      });
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (selectedItems.length === 0) return;
    await bulkDelete.mutateAsync(selectedItems.map((s) => s.id));
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
      ? `Tem certeza que deseja eliminar o servidor "${singleSelected?.hostname}"? Esta acao nao pode ser desfeita.`
      : `Tem certeza que deseja eliminar ${selectedItems.length} servidores? Esta acao nao pode ser desfeita.`;

  return (
    <div>
      <PageHeader title="Servidores" description="Inventario de infraestrutura" />

      <ServerFormDialog isOpen={isFormOpen} onClose={closeDialog} server={editingServer} duplicateFrom={duplicatingServer} />
      <ServerImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar servidor"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={bulkDelete.isPending}
        error={bulkDelete.isError ? (bulkDelete.error?.message ?? 'Erro ao eliminar servidor') : null}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreateDialog} title="Incluir um novo servidor">
          Incluir Servidor
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<UploadIcon />}
          onClick={() => setIsImportOpen(true)}
          title="Importar servidores em massa a partir de arquivo CSV"
        >
          Importar
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openEditDialog(singleSelected)}
          title={singleSelected ? `Editar ${singleSelected.hostname}` : 'Selecione um servidor para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openDuplicateDialog(singleSelected)}
          title={singleSelected ? `Duplicar ${singleSelected.hostname}` : 'Selecione um servidor para duplicar'}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<PowerIcon />}
          disabled={!singleSelected || setServerStatus.isPending}
          onClick={handleToggleStatusSelected}
          title={
            singleSelected
              ? singleSelected.status === 'deactivated'
                ? `Ativar ${singleSelected.hostname}`
                : `Desativar ${singleSelected.hostname}`
              : 'Selecione um servidor para ativar ou desativar'
          }
        >
          {singleSelected?.status === 'deactivated' ? 'Ativar' : 'Desativar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={selectedItems.length === 0 || bulkDelete.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
          title={selectedItems.length > 0 ? `Eliminar ${selectedItems.length} servidor(es)` : 'Selecione servidores para eliminar'}
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedItems.length > 0
            ? selectedItems.length === 1
              ? `Selecionado: ${singleSelected?.hostname}`
              : `${selectedItems.length} servidores selecionados`
            : 'Selecione servidores na lista para editar, ativar/desativar ou eliminar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar servidores'}
        />
      )}
      {data && items.length === 0 && (
        <EmptyState title="Nenhum servidor encontrado" description="Cadastre o primeiro servidor." />
      )}

      {data && items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-sky-500"
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-2 font-medium">Hostname</th>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Provedor</th>
                <th className="px-4 py-2 font-medium">Ambiente</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((server) => (
                <tr
                  key={server.id}
                  onClick={() => toggleOne(server.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    selectedIds.has(server.id) ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(server.id)}
                      onChange={() => toggleOne(server.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Selecionar ${server.hostname}`}
                      className="h-4 w-4 accent-sky-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/servers/${server.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-mono text-slate-100 hover:underline"
                    >
                      {server.hostname}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{server.displayName ?? '-'}</td>
                  <td className="px-4 py-2 text-slate-400">{translateServerType(server.serverType)}</td>
                  <td className="px-4 py-2 text-slate-400">{translateProvider(server.provider)}</td>
                  <td className="px-4 py-2 text-slate-400">{translateEnvironment(server.environment)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={STATUS_TONE[server.status] ?? 'default'}>
                      {translateServerStatus(server.status)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
