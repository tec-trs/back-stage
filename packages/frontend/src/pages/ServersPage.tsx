import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ServerFormDialog } from '../features/servers/ServerFormDialog';
import { ServerImportDialog } from '../features/servers/ServerImportDialog';
import { useDeleteServer } from '../features/servers/use-delete-server';
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
  const deleteServer = useDeleteServer();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerSummary | null>(null);
  const [duplicatingServer, setDuplicatingServer] = useState<ServerSummary | null>(null);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const selectedServer = data?.items.find((item) => item.id === selectedServerId) ?? null;

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

  function handleEditSelected(): void {
    if (selectedServer) {
      openEditDialog(selectedServer);
    }
  }

  function handleDuplicateSelected(): void {
    if (selectedServer) {
      openDuplicateDialog(selectedServer);
    }
  }

  function handleToggleStatusSelected(): void {
    if (selectedServer) {
      setServerStatus.mutate({
        id: selectedServer.id,
        status: selectedServer.status === 'deactivated' ? 'active' : 'deactivated',
      });
    }
  }

  function handleDeleteSelected(): void {
    if (selectedServer) {
      setConfirmDeleteOpen(true);
    }
  }

  function handleConfirmDelete(): void {
    if (!selectedServer) return;
    deleteServer.mutate(selectedServer.id, {
      onSuccess: () => {
        setSelectedServerId(null);
        setConfirmDeleteOpen(false);
      },
    });
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    deleteServer.reset();
  }

  return (
    <div>
      <PageHeader title="Servidores" description="Inventario de infraestrutura" />

      <ServerFormDialog isOpen={isFormOpen} onClose={closeDialog} server={editingServer} duplicateFrom={duplicatingServer} />
      <ServerImportDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar servidor"
        message={`Tem certeza que deseja eliminar o servidor "${selectedServer?.hostname}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={deleteServer.isPending}
        error={deleteServer.isError ? (deleteServer.error?.message ?? 'Erro ao eliminar servidor') : null}
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
          disabled={!selectedServer}
          onClick={handleEditSelected}
          title={selectedServer ? `Editar ${selectedServer.hostname}` : 'Selecione um servidor para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<CopyIcon />}
          disabled={!selectedServer}
          onClick={handleDuplicateSelected}
          title={selectedServer ? `Duplicar ${selectedServer.hostname}` : 'Selecione um servidor para duplicar'}
        >
          Duplicar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<PowerIcon />}
          disabled={!selectedServer || setServerStatus.isPending}
          onClick={handleToggleStatusSelected}
          title={
            selectedServer
              ? selectedServer.status === 'deactivated'
                ? `Ativar ${selectedServer.hostname}`
                : `Desativar ${selectedServer.hostname}`
              : 'Selecione um servidor para ativar ou desativar'
          }
        >
          {selectedServer?.status === 'deactivated' ? 'Ativar' : 'Desativar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selectedServer || deleteServer.isPending}
          onClick={handleDeleteSelected}
          title={selectedServer ? `Eliminar ${selectedServer.hostname}` : 'Selecione um servidor para eliminar'}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedServer
            ? `Selecionado: ${selectedServer.hostname}`
            : 'Selecione um servidor na lista para editar, ativar/desativar ou eliminar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar servidores'}
        />
      )}
      {data && data.items.length === 0 && (
        <EmptyState title="Nenhum servidor encontrado" description="Cadastre o primeiro servidor." />
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2" />
                <th className="px-4 py-2 font-medium">Hostname</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">Provedor</th>
                <th className="px-4 py-2 font-medium">Ambiente</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((server) => (
                <tr
                  key={server.id}
                  onClick={() => setSelectedServerId(server.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    server.id === selectedServerId ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="radio"
                      name="selected-server"
                      checked={server.id === selectedServerId}
                      onChange={() => setSelectedServerId(server.id)}
                      aria-label={`Selecionar ${server.hostname}`}
                      className="h-4 w-4 accent-sky-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/servers/${server.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="text-slate-100 hover:underline"
                    >
                      {server.displayName ?? server.hostname}
                    </Link>
                  </td>
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
