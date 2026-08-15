import { useState } from 'react';

import { ServerTypeFormDialog } from '../features/server-types/ServerTypeFormDialog';
import { useDeleteServerType } from '../features/server-types/use-delete-server-type';
import { useServerTypes } from '../features/server-types/use-server-types';
import type { ServerTypeSummary } from '../features/server-types/use-server-types';
import { useUpdateServerType } from '../features/server-types/use-update-server-type';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, PowerIcon, TrashIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

export function ServerTypesPage() {
  const { data, isLoading, isError, error } = useServerTypes();
  const deleteServerType = useDeleteServerType();
  const updateServerType = useUpdateServerType();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServerTypeSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selected = items.find((e) => e.id === selectedId) ?? null;

  function openCreate(): void {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEdit(item: ServerTypeSummary): void {
    setEditing(item);
    setIsFormOpen(true);
  }

  function closeDialog(): void {
    setIsFormOpen(false);
    setEditing(null);
  }

  function handleToggleActive(): void {
    if (!selected) return;
    updateServerType.mutate({ id: selected.id, isActive: !selected.isActive });
  }

  function handleDeleteSelected(): void {
    if (selected) setConfirmDeleteOpen(true);
  }

  function handleConfirmDelete(): void {
    if (!selected) return;
    deleteServerType.mutate(selected.id, {
      onSuccess: () => {
        setSelectedId(null);
        setConfirmDeleteOpen(false);
      },
    });
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    deleteServerType.reset();
  }

  return (
    <div>
      <PageHeader
        title="Tipos de Maquina"
        description="Tipos de maquina utilizados no cadastro de servidores"
      />

      <ServerTypeFormDialog isOpen={isFormOpen} onClose={closeDialog} serverType={editing} />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar tipo de maquina"
        message={`Tem certeza que deseja eliminar o tipo "${selected?.name}" (${selected?.slug})? Servidores que referenciam este slug nao serao afetados imediatamente.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={deleteServerType.isPending}
        error={
          deleteServerType.isError
            ? (deleteServerType.error?.message ?? 'Erro ao eliminar tipo de maquina')
            : null
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir Tipo
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
          variant="secondary"
          icon={<PowerIcon />}
          disabled={!selected || updateServerType.isPending}
          onClick={handleToggleActive}
        >
          {selected?.isActive ? 'Desativar' : 'Ativar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selected || deleteServerType.isPending}
          onClick={handleDeleteSelected}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selected
            ? `Selecionado: ${selected.name} (${selected.slug})`
            : 'Selecione um tipo para editar, ativar/desativar ou eliminar.'}
        </span>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message={error?.message ?? 'Erro ao carregar tipos de maquina'} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhum tipo de maquina cadastrado"
          description="Inclua tipos de maquina para utilizar no cadastro de servidores."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Descricao</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Situacao</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(isSelected ? null : item.id)}
                    className={`cursor-pointer border-b border-slate-800/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-slate-800' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-100">{item.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{item.slug}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {item.description ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={item.isActive ? 'success' : 'danger'}>
                        {item.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
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
