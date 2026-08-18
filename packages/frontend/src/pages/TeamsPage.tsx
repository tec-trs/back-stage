import { useState } from 'react';

import { TeamFormDialog } from '../features/teams/TeamFormDialog';
import { TeamMembersDialog } from '../features/teams/TeamMembersDialog';
import { useBulkDeleteTeams } from '../features/teams/use-bulk-delete-teams';
import { useTeams } from '../features/teams/use-teams';
import type { TeamSummary } from '../features/teams/use-teams';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, TrashIcon, UsersIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';

export function TeamsPage() {
  const { data, isLoading, isError, error } = useTeams();
  const bulkDelete = useBulkDeleteTeams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [membersTeam, setMembersTeam] = useState<TeamSummary | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selectedItems = items.filter((t) => selectedIds.has(t.id));
  const singleSelected = selectedItems.length === 1 ? selectedItems[0] : null;
  const allVisible = items.length > 0 && items.every((t) => selectedIds.has(t.id));

  function toggleAll(): void {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((t) => t.id)));
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

  function openEdit(team: TeamSummary): void {
    setEditing(team);
    setIsFormOpen(true);
  }

  function closeForm(): void {
    setIsFormOpen(false);
    setEditing(null);
  }

  function openMembers(team: TeamSummary): void {
    setMembersTeam(team);
  }

  function closeMembers(): void {
    setMembersTeam(null);
  }

  async function handleConfirmDelete(): Promise<void> {
    if (selectedItems.length === 0) return;
    await bulkDelete.mutateAsync(selectedItems.map((t) => t.id));
    setSelectedIds(new Set());
    setConfirmDeleteOpen(false);
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    bulkDelete.reset();
  }

  const freshMembersTeam = membersTeam
    ? (items.find((t) => t.id === membersTeam.id) ?? membersTeam)
    : null;

  const deleteLabel = selectedItems.length > 1 ? `Eliminar (${selectedItems.length})` : 'Eliminar';
  const deleteMessage =
    selectedItems.length === 1
      ? `Tem certeza que deseja eliminar o time "${singleSelected?.name}" (${singleSelected?.slug})? Os membros serao desvinculados.`
      : `Tem certeza que deseja eliminar ${selectedItems.length} times? Os membros serao desvinculados.`;

  return (
    <div>
      <PageHeader
        title="Times"
        description="Grupos de usuarios responsaveis por conjuntos de recursos"
      />

      <TeamFormDialog isOpen={isFormOpen} onClose={closeForm} team={editing} />

      {freshMembersTeam && (
        <TeamMembersDialog
          isOpen={Boolean(freshMembersTeam)}
          onClose={closeMembers}
          team={freshMembersTeam}
        />
      )}

      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar time"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={bulkDelete.isPending}
        error={bulkDelete.isError ? (bulkDelete.error?.message ?? 'Erro ao eliminar time') : null}
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreate}>
          Incluir Time
        </Button>
        <div className="mx-1 h-6 w-px bg-slate-800" />
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
          icon={<UsersIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openMembers(singleSelected)}
        >
          Membros
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
              : `${selectedItems.length} times selecionados`
            : 'Selecione times para editar, gerenciar membros ou eliminar.'}
        </span>
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {isError && <ErrorMessage message={error?.message ?? 'Erro ao carregar times'} />}

      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="Nenhum time cadastrado"
          description="Inclua times para agrupar usuarios responsaveis por recursos."
        />
      )}

      {!isLoading && !isError && items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-sky-500"
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Descricao</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Membros</th>
              </tr>
            </thead>
            <tbody>
              {items.map((team) => {
                const isSelected = selectedIds.has(team.id);
                return (
                  <tr
                    key={team.id}
                    onClick={() => toggleOne(team.id)}
                    className={`cursor-pointer border-b border-slate-800/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-sky-950/40' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(team.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Selecionar ${team.name}`}
                        className="h-4 w-4 accent-sky-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-100">{team.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{team.slug}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {team.description ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{team.memberCount}</Badge>
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
