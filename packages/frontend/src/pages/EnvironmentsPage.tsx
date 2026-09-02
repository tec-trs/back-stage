import { useState } from 'react';

import { EnvironmentFormDialog } from '../features/environments/EnvironmentFormDialog';
import { useBulkDeleteEnvironments } from '../features/environments/use-bulk-delete-environments';
import { useEnvironments } from '../features/environments/use-environments';
import type { EnvironmentSummary } from '../features/environments/use-environments';
import { useUpdateEnvironment } from '../features/environments/use-update-environment';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, PowerIcon, TrashIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

const COLOR_LABEL: Record<string, string> = {
  danger: 'Vermelho',
  warning: 'Amarelo',
  success: 'Verde',
  default: 'Cinza',
};

export function EnvironmentsPage() {
  const { data, isLoading, isError, error } = useEnvironments();
  const bulkDelete = useBulkDeleteEnvironments();
  const updateEnvironment = useUpdateEnvironment();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnvironment, setEditingEnvironment] = useState<EnvironmentSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selectedItems = items.filter((e) => selectedIds.has(e.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = items.length > 0 && items.every((e) => selectedIds.has(e.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((e) => e.id)));
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
    setEditingEnvironment(null);
    setIsFormOpen(true);
  }

  function openEdit(env: EnvironmentSummary): void {
    setEditingEnvironment(env);
    setIsFormOpen(true);
  }

  function closeDialog(): void {
    setIsFormOpen(false);
    setEditingEnvironment(null);
    setSelectedIds(new Set());
  }

  function handleToggleActive(): void {
    if (!singleSelected) return;
    updateEnvironment.mutate({
      id: singleSelected.id,
      isActive: !singleSelected.isActive,
    });
  }

  async function handleConfirmDelete(): Promise<void> {
    if (selectedItems.length === 0) return;
    await bulkDelete.mutateAsync(selectedItems.map((e) => e.id));
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
      ? `Tem certeza que deseja eliminar o ambiente "${singleSelected?.name}" (${singleSelected?.slug})? Servidores e implantacoes que referenciam este slug nao serao afetados imediatamente.`
      : `Tem certeza que deseja eliminar ${selectedItems.length} ambientes? Servidores e implantacoes que os referenciam nao serao afetados imediatamente.`;

  return (
    <div>
      <PageHeader
        title="Ambientes"
        description="Ambientes de infraestrutura utilizados por servidores e implantacoes"
      />

      <EnvironmentFormDialog
        isOpen={isFormOpen}
        onClose={closeDialog}
        environment={editingEnvironment}
      />

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar ambiente"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={bulkDelete.isPending}
        error={bulkDelete.isError ? (bulkDelete.error?.message ?? 'Erro ao eliminar ambiente') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-line bg-surface/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate} title="Incluir novo ambiente">
          Incluir Ambiente
        </Button>
        <div className="mx-1 h-6 w-px bg-surface-raised" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openEdit(singleSelected)}
          title={singleSelected ? `Editar ${singleSelected.name}` : 'Selecione um ambiente para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<PowerIcon />}
          disabled={!singleSelected || updateEnvironment.isPending}
          onClick={handleToggleActive}
          title={
            singleSelected
              ? singleSelected.isActive
                ? `Desativar ${singleSelected.name}`
                : `Ativar ${singleSelected.name}`
              : 'Selecione um ambiente'
          }
        >
          {singleSelected?.isActive ? 'Desativar' : 'Ativar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={selectedItems.length === 0 || bulkDelete.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
          title={selectedItems.length > 0 ? `Eliminar ${selectedItems.length} ambiente(s)` : 'Selecione ambientes para eliminar'}
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedItems.length > 0
            ? selectedItems.length === 1
              ? `Selecionado: ${singleSelected?.name} (${singleSelected?.slug})`
              : `${selectedItems.length} ambientes selecionados`
            : 'Selecione ambientes para editar, ativar/desativar ou eliminar.'}
        </span>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message={error?.message ?? 'Erro ao carregar ambientes'} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhum ambiente cadastrado"
          description="Inclua ambientes para utilizar nos cadastros de servidores e implantacoes."
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
                <th className="px-4 py-3 text-left font-medium text-slate-400">Cor</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Situacao</th>
              </tr>
            </thead>
            <tbody>
              {items.map((env) => {
                const isSelected = selectedIds.has(env.id);
                return (
                  <tr
                    key={env.id}
                    onClick={() => toggleOne(env.id)}
                    className={`cursor-pointer border-b border-line/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-signal/10' : 'hover:bg-surface/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(env.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${env.name}`}
                        className="h-4 w-4 accent-signal"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-100">{env.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{env.slug}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {env.description ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={env.color}>{COLOR_LABEL[env.color] ?? env.color}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={env.isActive ? 'success' : 'danger'}>
                        {env.isActive ? 'Ativo' : 'Inativo'}
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
