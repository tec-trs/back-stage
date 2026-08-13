import { useState } from 'react';

import { useAuthStore } from '../features/auth/auth.store';
import { useDeleteUser } from '../features/users/use-delete-user';
import { useSetUserActive } from '../features/users/use-set-user-active';
import { useUsers } from '../features/users/use-users';
import type { UserSummary } from '../features/users/use-users';
import { UserFormDialog } from '../features/users/UserFormDialog';
import { Badge } from '../shared/components/Badge';
import { Button } from '../shared/components/Button';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
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
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  if (!currentUser?.roles.includes('admin')) {
    return (
      <div>
        <PageHeader title="Usuarios" description="Gestao de acesso a aplicacao" />
        <ErrorMessage message="Apenas administradores podem gerenciar usuarios." />
      </div>
    );
  }

  const selectedUser = data?.items.find((item) => item.id === selectedUserId) ?? null;
  const isSelfSelected = selectedUser?.id === currentUser.id;

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

  function handleEditSelected(): void {
    if (selectedUser) {
      openEditDialog(selectedUser);
    }
  }

  function handleToggleActiveSelected(): void {
    if (selectedUser) {
      setUserActive.mutate({ id: selectedUser.id, isActive: !selectedUser.isActive });
    }
  }

  function handleDeleteSelected(): void {
    if (!selectedUser) {
      return;
    }
    const confirmed = window.confirm(
      `Tem certeza que deseja eliminar o usuario "${selectedUser.fullName}"? Esta acao nao pode ser desfeita.`,
    );
    if (confirmed) {
      deleteUser.mutate(selectedUser.id, { onSuccess: () => setSelectedUserId(null) });
    }
  }

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestao de acesso a aplicacao"
        actions={<Button onClick={openCreateDialog}>+ Novo Usuario</Button>}
      />

      <UserFormDialog isOpen={isFormOpen} onClose={closeDialog} user={editingUser} />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!selectedUser}
          onClick={handleEditSelected}
        >
          Editar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={!selectedUser || isSelfSelected || setUserActive.isPending}
          onClick={handleToggleActiveSelected}
          title={isSelfSelected ? 'Voce nao pode inativar sua propria conta' : undefined}
        >
          {selectedUser && !selectedUser.isActive ? 'Ativar' : 'Inativar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={!selectedUser || isSelfSelected || deleteUser.isPending}
          onClick={handleDeleteSelected}
          title={isSelfSelected ? 'Voce nao pode eliminar sua propria conta' : undefined}
        >
          Eliminar
        </Button>
        <span className="ml-auto text-xs text-slate-500">
          {selectedUser
            ? `Selecionado: ${selectedUser.fullName}`
            : 'Selecione um usuario na lista para editar, ativar/inativar ou eliminar.'}
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
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="w-10 px-4 py-2" />
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
                  onClick={() => setSelectedUserId(user.id)}
                  className={`cursor-pointer border-t border-slate-800 ${
                    user.id === selectedUserId ? 'bg-sky-950/40' : 'hover:bg-slate-900/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    <input
                      type="radio"
                      name="selected-user"
                      checked={user.id === selectedUserId}
                      onChange={() => setSelectedUserId(user.id)}
                      aria-label={`Selecionar ${user.fullName}`}
                      className="h-4 w-4 accent-sky-500"
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
