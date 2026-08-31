import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { DatabaseGroupFormDialog } from '../features/database-groups/DatabaseGroupFormDialog';
import {
  useBulkDeleteDatabaseGroups,
  useDatabaseGroups,
  type DatabaseGroup,
} from '../features/database-groups/use-database-groups';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, TrashIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

export function DatabaseGroupsPage() {
  const { data, isLoading, isError, error } = useDatabaseGroups();
  const bulkDelete = useBulkDeleteDatabaseGroups();
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DatabaseGroup | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selectedItems = items.filter((g) => selectedIds.has(g.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = items.length > 0 && items.every((g) => selectedIds.has(g.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((g) => g.id)));
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
    setEditingGroup(null);
    setIsFormOpen(true);
  }

  function openEditDialog(group: DatabaseGroup): void {
    setEditingGroup(group);
    setIsFormOpen(true);
  }

  function closeDialog(createdId?: string): void {
    setIsFormOpen(false);
    setEditingGroup(null);
    setSelectedIds(new Set());
    if (createdId) navigate(`/database-groups/${createdId}`);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (selectedItems.length === 0) return;
    await bulkDelete.mutateAsync(selectedItems.map((g) => g.id));
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
      ? `Tem certeza que deseja eliminar o agrupador "${singleSelected?.name}"? Os bancos em si não são afetados.`
      : `Tem certeza que deseja eliminar ${selectedItems.length} agrupadores? Os bancos em si não são afetados.`;

  return (
    <div>
      <PageHeader
        title="Agrupadores de Bancos"
        description="Coleções nomeadas de bancos de dados do inventário, para documentar instâncias, empresas ou módulos que fazem mais sentido discutidos em conjunto"
      />

      <DatabaseGroupFormDialog isOpen={isFormOpen} onClose={closeDialog} group={editingGroup} />
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar agrupador"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={bulkDelete.isPending}
        error={bulkDelete.isError ? (bulkDelete.error?.message ?? 'Erro ao eliminar agrupador') : null}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreateDialog} title="Incluir um novo agrupador">
          Incluir Agrupador
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openEditDialog(singleSelected)}
          title={singleSelected ? `Editar ${singleSelected.name}` : 'Selecione um agrupador para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={selectedItems.length === 0 || bulkDelete.isPending}
          onClick={() => setConfirmDeleteOpen(true)}
          title={selectedItems.length > 0 ? `Eliminar ${selectedItems.length} agrupador(es)` : 'Selecione agrupadores para eliminar'}
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedItems.length > 0
            ? selectedItems.length === 1
              ? `Selecionado: ${singleSelected?.name}`
              : `${selectedItems.length} agrupadores selecionados`
            : 'Selecione agrupadores na lista para editar ou eliminar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage message={error instanceof Error ? error.message : 'Erro ao carregar agrupadores'} />
      )}
      {data && items.length === 0 && (
        <EmptyState
          title="Nenhum agrupador cadastrado"
          description='Crie um agrupador e comece a adicionar bancos com "Incluir Agrupador".'
        />
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
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Descrição</th>
                <th className="px-4 py-2 font-medium">Bancos</th>
                <th className="px-4 py-2 font-medium">Aplicações</th>
                <th className="px-4 py-2 font-medium">Atualizado em</th>
              </tr>
            </thead>
            <tbody>
              {items.map((group) => (
                <tr
                  key={group.id}
                  onClick={() => toggleOne(group.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    selectedIds.has(group.id) ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(group.id)}
                      onChange={() => toggleOne(group.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Selecionar ${group.name}`}
                      className="h-4 w-4 accent-sky-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/database-groups/${group.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-slate-100 hover:underline"
                    >
                      {group.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-400">{group.description || '—'}</td>
                  <td className="px-4 py-2 font-mono text-slate-300">{group.memberCount}</td>
                  <td className="px-4 py-2 font-mono text-slate-300">{group.applicationCount}</td>
                  <td className="px-4 py-2 text-slate-500">
                    {new Date(group.updatedAt).toLocaleDateString('pt-BR')}
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
