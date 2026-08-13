import { type FormEvent, useEffect, useState } from 'react';

import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { ROLE_LABELS, translateRole } from '../../shared/constants/labels';

import { useCreateUser } from './use-create-user';
import { useUpdateUser } from './use-update-user';
import type { UserRole, UserSummary } from './use-users';

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserSummary | null;
}

export function UserFormDialog({ isOpen, onClose, user }: UserFormDialogProps) {
  const isEditMode = Boolean(user);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const mutation = isEditMode ? updateUser : createUser;

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<UserRole[]>(['viewer']);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEmail(user?.email ?? '');
      setFullName(user?.fullName ?? '');
      setPassword('');
      setRoles(user?.roles ?? ['viewer']);
      setRolesError(null);
      createUser.reset();
      updateUser.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  function toggleRole(role: UserRole): void {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  function handleClose(): void {
    onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (roles.length === 0) {
      setRolesError('Selecione pelo menos um perfil');
      return;
    }
    setRolesError(null);

    if (isEditMode && user) {
      updateUser.mutate(
        { id: user.id, email, fullName, roles },
        { onSuccess: handleClose },
      );
      return;
    }

    createUser.mutate(
      { email, fullName, password, roles },
      { onSuccess: handleClose },
    );
  }

  return (
    <Modal
      title={isEditMode ? 'Editar Usuario' : 'Novo Usuario'}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome completo *</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Maria Souza"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Email *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="maria.souza@back-stage.dev"
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
          />
        </label>

        {!isEditMode && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-400">Senha (minimo 8 caracteres) *</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
            />
          </label>
        )}

        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1 text-slate-400">Perfis de acesso *</legend>
          <div className="flex flex-col gap-2">
            {ALL_ROLES.map((role) => (
              <label key={role} className="flex items-center gap-2 text-slate-200">
                <input
                  type="checkbox"
                  checked={roles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="rounded border-slate-700 bg-slate-950"
                />
                {translateRole(role)}
              </label>
            ))}
          </div>
          {rolesError && <span className="text-xs text-red-400">{rolesError}</span>}
        </fieldset>

        {mutation.isError && (
          <ErrorMessage
            message={mutation.error instanceof Error ? mutation.error.message : 'Erro ao salvar usuario'}
          />
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:opacity-60"
          >
            {mutation.isPending
              ? 'Salvando...'
              : isEditMode
                ? 'Salvar alteracoes'
                : 'Criar usuario'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
