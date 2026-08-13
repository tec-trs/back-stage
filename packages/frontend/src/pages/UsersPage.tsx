import { useState } from 'react';

import { useAuthStore } from '../features/auth/auth.store';
import { useSetUserActive } from '../features/users/use-set-user-active';
import { useUsers } from '../features/users/use-users';
import type { UserSummary } from '../features/users/use-users';
import { UserFormDialog } from '../features/users/UserFormDialog';
import { Badge } from '../shared/components/Badge';
import { EmptyState } from '../shared/components/EmptyState';
import { ErrorMessage } from '../shared/components/ErrorMessage';
import { PageHeader } from '../shared/components/PageHeader';
import { Spinner } from '../shared/components/Spinner';
import { translateRole } from '../shared/constants/labels';

export function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const { data, isLoading, isError, error } = useUsers();
  const setUserActive = useSetUserActive();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSummary | null>(null);

  if (!currentUser?.roles.includes('admin')) {
    return (
      <div>
        <PageHeader title="Usuarios" description="Gestao de acesso a aplicacao" />
        <ErrorMessage message="Apenas administradores podem gerenciar usuarios." />
      </div>
    );
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

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Gestao de acesso a aplicacao"
        actions={
          <button
            type="button"
            onClick={openCreateDialog}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white"
          >
            + Novo Usuario
          </button>
        }
      />

      <UserFormDialog isOpen={isFormOpen} onClose={closeDialog} user={editingUser} />

      {isLoading && <Spinner />}
      {isError && (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Erro ao carregar usuarios'}
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
                <th className="px-4 py-2 font-medium">Nome</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Perfis</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id} className="border-t border-slate-800 hover:bg-slate-900/50">
                  <td className="px-4 py-2 text-slate-100">{user.fullName}</td>
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
                  <td className="px-4 py-2">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => openEditDialog(user)}
                        className="text-sky-400 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={user.id === currentUser.id || setUserActive.isPending}
                        onClick={() =>
                          setUserActive.mutate({ id: user.id, isActive: !user.isActive })
                        }
                        className="text-slate-300 hover:underline disabled:cursor-not-allowed disabled:text-slate-600 disabled:hover:no-underline"
                        title={
                          user.id === currentUser.id
                            ? 'Voce nao pode inativar sua propria conta'
                            : undefined
                        }
                      >
                        {user.isActive ? 'Inativar' : 'Ativar'}
                      </button>
                    </div>
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
