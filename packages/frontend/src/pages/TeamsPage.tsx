import { useState } from 'react';

import { TeamFormDialog } from '../features/teams/TeamFormDialog';
import { TeamMembersDialog } from '../features/teams/TeamMembersDialog';
import { useDeleteTeam } from '../features/teams/use-delete-team';
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
  const deleteTeam = useDeleteTeam();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [membersTeam, setMembersTeam] = useState<TeamSummary | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const items = data ?? [];
  const selected = items.find((t) => t.id === selectedId) ?? null;

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

  function handleDeleteSelected(): void {
    if (selected) setConfirmDeleteOpen(true);
  }

  function handleConfirmDelete(): void {
    if (!selected) return;
    deleteTeam.mutate(selected.id, {
      onSuccess: () => {
        setSelectedId(null);
        setConfirmDeleteOpen(false);
      },
    });
  }

  function closeConfirmDelete(): void {
    setConfirmDeleteOpen(false);
    deleteTeam.reset();
  }

  // When the members dialog is open we want to pass the freshest version
  // of the team (so role changes/additions are reflected immediately).
  const freshMembersTeam = membersTeam
    ? (items.find((t) => t.id === membersTeam.id) ?? membersTeam)
    : null;

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
        message={`Tem certeza que deseja eliminar o time "${selected?.name}" (${selected?.slug})? Os membros serao desvinculados.`}
        confirmLabel="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={closeConfirmDelete}
        isPending={deleteTeam.isPending}
        error={
          deleteTeam.isError
            ? (deleteTeam.error?.message ?? 'Erro ao eliminar time')
            : null
        }
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
          disabled={!selected}
          onClick={() => selected && openEdit(selected)}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<UsersIcon />}
          disabled={!selected}
          onClick={() => selected && openMembers(selected)}
        >
          Membros
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={!selected || deleteTeam.isPending}
          onClick={handleDeleteSelected}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selected
            ? `Selecionado: ${selected.name} (${selected.slug})`
            : 'Selecione um time para editar, gerenciar membros ou eliminar.'}
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
                <th className="px-4 py-3 text-left font-medium text-slate-400">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Descricao</th>
                <th className="px-4 py-3 text-left font-medium text-slate-400">Membros</th>
              </tr>
            </thead>
            <tbody>
              {items.map((team) => {
                const isSelected = team.id === selectedId;
                return (
                  <tr
                    key={team.id}
                    onClick={() => setSelectedId(isSelected ? null : team.id)}
                    className={`cursor-pointer border-b border-slate-800/50 transition-colors last:border-0 ${
                      isSelected ? 'bg-slate-800' : 'hover:bg-slate-900/60'
                    }`}
                  >
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
