import { useState } from 'react';

import { useAuthStore } from '../features/auth/auth.store';
import { useDeleteUser } from '../features/users/use-delete-user';
import { useSetUserActive } from '../features/users/use-set-user-active';
import { useUsers } from '../features/users/use-users';
import type { UserSummary } from '../features/users/use-users';
import { UserFormDialog } from '../features/users/UserFormDialog';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { ConfirmDialog } from '../shared/components/ConfirmDialog';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PencilIcon, PlusIcon, PowerIcon, TrashIcon } from '../shared/components/icons';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import { translateRole } from '../shared/constants/labels';

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const { data, isLoading, isError, error } = useUsers();
  const setUserActive = useSetUserActive();
  const deleteUser = useDeleteUser();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isBulkPending, setIsBulkPending] = useState(false);

  if (!currentUser?.roles.includes('admin')) {
    return (
      <div>
        <PageHeader title="Usuarios" description="Gestao de acesso a aplicacao" />
        <ErrorMessage message="Apenas administradores podem gerenciar usuarios." />
      </div>
    );
  }

  const users = data?.items ?? [];
  const selectedUsers = users.filter((u) => selectedIds.has(u.id));
  const singleSelected = selectedUsers.length === 1 ? selectedUsers[0] : null;
  const selectionHasSelf = selectedUsers.some((u) => u.id === currentUser.id);
  const nonSelfSelected = selectedUsers.filter((u) => u.id !== currentUser.id);
  const allSelectedInactive = nonSelfSelected.length > 0 && nonSelfSelected.every((u) => !u.isActive);
  const allVisible = users.length > 0 && users.every((u) => selectedIds.has(u.id));

  function toggleAll() {
    if (allVisible) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)));
    }
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openCreateDialog(): void {
    setEditingUser(null);
    setIsFormOpen(true);
  }

  function openEditDialog(user: UserSummary): void {
    setEditingUser(user);
    setIsFormOpen(true);
  }

  function closeDialog(): void {
    setIsFormOpen(false);
    setEditingUser(null);
  }

  async function handleBulkToggleActive(): Promise<void> {
    if (nonSelfSelected.length === 0) return;
    const targetActive = allSelectedInactive;
    setIsBulkPending(true);
    try {
      for (const user of nonSelfSelected) {
        await setUserActive.mutateAsync({ id: user.id, isActive: targetActive });
      }
      setSelectedIds(new Set());
    } finally {
      setIsBulkPending(false);
    }
  }

  async function handleConfirmDelete(): Promise<void> {
    if (nonSelfSelected.length === 0) return;
    setIsBulkPending(true);
    try {
      for (const user of nonSelfSelected) {
        await deleteUser.mutateAsync(user.id);
      }
      setSelectedIds(new Set());
      setConfirmDeleteOpen(false);
    } finally {
      setIsBulkPending(false);
    }
  }

  const toggleActiveLabel = allSelectedInactive
    ? `Ativar${nonSelfSelected.length > 1 ? ` (${nonSelfSelected.length})` : ''}`
    : `Inativar${nonSelfSelected.length > 1 ? ` (${nonSelfSelected.length})` : ''}`;

  const deleteLabel =
    nonSelfSelected.length > 1 ? `Eliminar (${nonSelfSelected.length})` : 'Eliminar';

  const deleteMessage =
    nonSelfSelected.length === 1
      ? `Tem certeza que deseja eliminar o usuario "${nonSelfSelected[0]?.fullName}"? Esta acao nao pode ser desfeita.`
      : `Tem certeza que deseja eliminar ${nonSelfSelected.length} usuarios? Esta acao nao pode ser desfeita.`;

  return (
    <div>
      <PageHeader title="Usuarios" description="Gestao de acesso a aplicacao" />

      <UserFormDialog isOpen={isFormOpen} onClose={closeDialog} user={editingUser} />
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Eliminar usuario(s)"
        message={deleteMessage}
        confirmLabel="Eliminar"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => { setConfirmDeleteOpen(false); deleteUser.reset(); }}
        isPending={isBulkPending}
        error={deleteUser.isError ? (deleteUser.error?.message ?? 'Erro ao eliminar usuario') : null}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border border-line bg-surface/40 p-2">
        <Button size="sm" icon={<PlusIcon />} onClick={openCreateDialog}>
          Incluir Usuario
        </Button>
        <div className="mx-1 h-6 w-px bg-surface-raised" />
        <Button
          size="sm"
          variant="secondary"
          icon={<PencilIcon />}
          disabled={!singleSelected}
          onClick={() => singleSelected && openEditDialog(singleSelected)}
          title={singleSelected ? `Editar ${singleSelected.fullName}` : 'Selecione exatamente 1 usuario para editar'}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<PowerIcon />}
          disabled={nonSelfSelected.length === 0 || isBulkPending}
          onClick={() => void handleBulkToggleActive()}
          title={selectionHasSelf ? 'Voce nao pode alterar sua propria conta' : ''}
        >
          {toggleActiveLabel}
        </Button>
        <Button
          size="sm"
          variant="danger"
          icon={<TrashIcon />}
          disabled={nonSelfSelected.length === 0 || isBulkPending}
          onClick={() => setConfirmDeleteOpen(true)}
          title={selectionHasSelf ? 'Voce nao pode eliminar sua propria conta' : ''}
        >
          {deleteLabel}
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedIds.size > 0
            ? `${selectedIds.size} selecionado(s)${selectionHasSelf ? ' · sua conta nao sera afetada' : ''}`
            : 'Selecione usuarios na lista para editar, ativar/inativar ou eliminar.'}
        </span>
      </div>

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar usuarios'}
        />
      )}
      {deleteUser.isError && (
        <ErrorMessage
          message={
            deleteUser.error instanceof Error
              ? deleteUser.error.message
              : 'Erro ao eliminar usuario'
          }
        />
      )}
      {data && data.items.length === 0 && (
        <EmptyState title="Nenhum usuario encontrado" description="Cadastre o primeiro usuario." />
      )}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    onChange={toggleAll}
                    className="h-4 w-4 accent-signal"
                    aria-label="Selecionar todos"
                  />
                </th>
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Codigo</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Perfis</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => toggleOne(user.id)}
                  className={`cursor-pointer border-t border-line ${
                    selectedIds.has(user.id) ? 'bg-signal/10' : 'hover:bg-surface/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleOne(user.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 accent-signal"
                      aria-label={`Selecionar ${user.fullName}`}
                    />
                  </td>
                  <td className="px-4 py-2 text-slate-100">{user.fullName}</td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-400">{user.code}</td>
                  <td className="px-4 py-2 text-slate-400">{user.email}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role}>{translateRole(role)}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
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
