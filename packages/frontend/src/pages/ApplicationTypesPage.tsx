import { useState } from 'react';

import { ApplicationTypeFormDialog } from '../features/application-types/ApplicationTypeFormDialog';
import { useBulkDeleteApplicationTypes } from '../features/application-types/use-bulk-delete-application-types';
import { useApplicationTypes } from '../features/application-types/use-application-types';
import type { ApplicationTypeSummary } from '../features/application-types/use-application-types';
import { useUpdateApplicationType } from '../features/application-types/use-update-application-type';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, PowerIcon, TrashIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

export function ApplicationTypesPage() {
  const { data, isLoading, isError, error } = useApplicationTypes();
  const bulkDelete = useBulkDeleteApplicationTypes();
  const updateApplicationType = useUpdateApplicationType();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationTypeSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selectedItems = items.filter((i) => selectedIds.has(i.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = items.length > 0 && items.every((i) => selectedIds.has(i.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
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
    setIsFormOpen(true);
  }

  function openEdit(item: ApplicationTypeSummary): void {
    setEditing(item);
    setIsFormOpen(true);
  }

  function closeDialog(): void {
    setIsFormOpen(false);
    setEditing(null);
    setSelectedIds(new Set());
  }

  function handleToggleActive(): void {
    if (!singleSelected) return;
    updateApplicationType.mutate({ id: singleSelected.id, isActive: !singleSelected.isActive });
  }

  async function handleConfirmDelete(): Promise<void> {
    if (selectedItems.length === 0) return;
    await bulkDelete.mutateAsync(selectedItems.map((i) => i.id));
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
      ? `Tem certeza que deseja eliminar o tipo "${singleSelected?.name}" (${singleSelected?.slug})? Aplicacoes que referenciam este slug nao serao afetadas imediatamente.`
      : `Tem certeza que deseja eliminar ${selectedItems.length} tipos de aplicacao? Aplicacoes que os referenciam nao serao afetadas imediatamente.`;

  return (
    <div>
      <PageHeader
        title="Tipos de Aplicacao"
        description="Tipos de aplicacao utilizados no cadastro de aplicacoes e sistemas"
      />

      <ApplicationTypeFormDialog
        isOpen={isFormOpen}
        onClose={closeDialog}
        applicationType={editing}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar tipo de aplicacao"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={bulkDelete.isPending}
        error={bulkDelete.isError ? (bulkDelete.error?.message ?? 'Erro ao eliminar tipo de aplicacao') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-line bg-surface/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir Tipo
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
          icon={<PowerIcon />}
          disabled={!singleSelected || updateApplicationType.isPending}
          onClick={handleToggleActive}
        >
          {singleSelected?.isActive ? 'Desativar' : 'Ativar'}
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
              ? `Selecionado: ${singleSelected?.name} (${singleSelected?.slug})`
              : `${selectedItems.length} tipos selecionados`
            : 'Selecione tipos para editar, ativar/desativar ou eliminar.'}
        </span>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message={error?.message ?? 'Erro ao carregar tipos de aplicacao'} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhum tipo de aplicacao cadastrado"
          description="Inclua tipos de aplicacao para utilizar no cadastro de sistemas e aplicacoes."
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
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Descricao</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Situacao</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr
                    key={item.id}
                    onClick={() => toggleOne(item.id)}
                    className={`cursor-pointer border-b border-line/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-signal/10' : 'hover:bg-surface/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${item.name}`}
                        className="h-4 w-4 accent-signal"
                      />
                    </td>
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
