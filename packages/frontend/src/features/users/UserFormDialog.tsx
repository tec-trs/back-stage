import { type FormEvent, useEffect, useState } from 'react';

import { useOrganizations } from '../organizations/use-organizations';
import { Button } from '../../shared/components/Button';
import { ErrorMessage } from '../../shared/components/ErrorMessage';
import { Modal } from '../../shared/components/Modal';
import { Spinner } from '../../shared/components/Spinner';
import { ROLE_LABELS, translateRole } from '../../shared/constants/labels';

import { useCreateUser } from './use-create-user';
import { useSetUserOrganizations } from './use-set-user-organizations';
import { useUpdateUser } from './use-update-user';
import { useUserOrganizations } from './use-user-organizations';
import type { UserOrgEntry } from './use-user-organizations';
import type { UserRole, UserSummary } from './use-users';

const ALL_ROLES = Object.keys(ROLE_LABELS) as UserRole[];
const CODE_PATTERN = /^[a-z0-9._-]+$/;

const ORG_ROLE_OPTIONS = [
  { value: 'owner', label: 'Proprietario' },
  { value: 'admin', label: 'Administrador' },
  { value: 'member', label: 'Membro' },
];

export function UserFormDialog({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user?: UserSummary | null;
}) {
  const isEditMode = Boolean(user);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const setUserOrgs = useSetUserOrganizations();
  const mutation = isEditMode ? updateUser : createUser;

  const { data: allOrgs, isLoading: orgsLoading } = useOrganizations();
  const { data: currentOrgs } = useUserOrganizations(user?.id);

  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<UserRole[]>(['viewer']);
  const [orgEntries, setOrgEntries] = useState<UserOrgEntry[]>([]);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [orgsError, setOrgsError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCode(user?.code ?? '');
      setEmail(user?.email ?? '');
      setFullName(user?.fullName ?? '');
      setPassword('');
      setRoles(user?.roles ?? ['viewer']);
      setOrgEntries(currentOrgs ?? []);
      setCodeError(null);
      setRolesError(null);
      setOrgsError(null);
      createUser.reset();
      updateUser.reset();
      setUserOrgs.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, currentOrgs]);

  function toggleRole(role: UserRole): void {
    setRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  function isOrgChecked(orgId: string): boolean {
    return orgEntries.some((e) => e.organizationId === orgId);
  }

  function getOrgRole(orgId: string): string {
    return orgEntries.find((e) => e.organizationId === orgId)?.role ?? 'member';
  }

  function toggleOrg(orgId: string): void {
    setOrgEntries((prev) => {
      if (prev.some((e) => e.organizationId === orgId)) {
        return prev.filter((e) => e.organizationId !== orgId);
      }
      return [...prev, { organizationId: orgId, role: 'member' }];
    });
  }

  function setOrgRole(orgId: string, role: string): void {
    setOrgEntries((prev) =>
      prev.map((e) => (e.organizationId === orgId ? { ...e, role } : e)),
    );
  }

  function handleClose(): void {
    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!isEditMode && !CODE_PATTERN.test(code)) {
      setCodeError('O codigo deve conter apenas letras minusculas, numeros, ponto, hifen e underscore');
      return;
    }
    setCodeError(null);

    if (roles.length === 0) {
      setRolesError('Selecione pelo menos um perfil');
      return;
    }
    setRolesError(null);

    if (orgEntries.length === 0) {
      setOrgsError('Selecione pelo menos uma organizacao');
      return;
    }
    setOrgsError(null);

    if (isEditMode && user) {
      updateUser.mutate(
        {
          id: user.id,
          code,
          email,
          fullName,
          roles,
          password: password.trim() === '' ? undefined : password,
        },
        {
          onSuccess: () => {
            setUserOrgs.mutate(
              { userId: user.id, organizations: orgEntries },
              { onSuccess: handleClose },
            );
          },
        },
      );
      return;
    }

    createUser.mutate(
      { code, email, fullName, password, roles },
      {
        onSuccess: (newUser) => {
          setUserOrgs.mutate(
            { userId: newUser.id, organizations: orgEntries },
            { onSuccess: handleClose },
          );
        },
      },
    );
  }

  const isPending = mutation.isPending || setUserOrgs.isPending;
  const saveError = mutation.error ?? setUserOrgs.error;

  const inputClass =
    'rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-500 disabled:opacity-70';

  return (
    <Modal
      title={isEditMode ? 'Editar Usuario' : 'Incluir Usuario'}
      isOpen={isOpen}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Codigo de usuario *</span>
          <input
            required
            disabled={isEditMode}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="maria.souza"
            className={inputClass}
          />
          {codeError && <span className="text-xs text-red-400">{codeError}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Nome completo *</span>
          <input
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Maria Souza"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">Email *</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="maria.souza@empresa.com"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-slate-400">
            {isEditMode ? 'Nova senha (minimo 8 caracteres)' : 'Senha (minimo 8 caracteres) *'}
          </span>
          <input
            type="password"
            required={!isEditMode}
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={isEditMode ? 'Deixe em branco para nao alterar' : undefined}
            className={inputClass}
          />
        </label>

        {/* Perfis */}
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1 text-slate-400">Perfis de acesso *</legend>
          <div className="flex flex-col gap-2">
            {ALL_ROLES.map((role) => (
              <label key={role} className="flex items-center gap-2 text-slate-200">
                <input
                  type="checkbox"
                  checked={roles.includes(role)}
                  onChange={() => toggleRole(role)}
                  className="rounded border-line bg-canvas"
                />
                {translateRole(role)}
              </label>
            ))}
          </div>
          {rolesError && <span className="text-xs text-red-400">{rolesError}</span>}
        </fieldset>

        {/* Organizações */}
        <fieldset className="flex flex-col gap-1 text-sm">
          <legend className="mb-1 text-slate-400">Organizacoes *</legend>
          {orgsLoading && <Spinner />}
          {!orgsLoading && (
            <div className="flex flex-col gap-2 rounded border border-line bg-surface/40 p-3">
              {(allOrgs ?? []).map((org) => {
                const checked = isOrgChecked(org.id);
                return (
                  <div key={org.id} className="flex items-center gap-3">
                    <label className="flex flex-1 items-center gap-2 text-slate-200">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOrg(org.id)}
                        className="rounded border-line bg-canvas"
                      />
                      <span className="font-medium">{org.name}</span>
                      <span className="font-mono text-xs text-slate-500">{org.slug}</span>
                    </label>
                    {checked && (
                      <select
                        value={getOrgRole(org.id)}
                        onChange={(e) => setOrgRole(org.id, e.target.value)}
                        className="rounded border border-line bg-surface-raised px-2 py-1 text-xs text-slate-200 outline-none focus:border-slate-500"
                      >
                        {ORG_ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
              {(allOrgs ?? []).length === 0 && (
                <p className="text-xs text-slate-500">Nenhuma organizacao cadastrada.</p>
              )}
            </div>
          )}
          {orgsError && <span className="text-xs text-red-400">{orgsError}</span>}
        </fieldset>

        {saveError && (
          <ErrorMessage
            message={saveError instanceof Error ? saveError.message : 'Erro ao salvar usuario'}
          />
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Salvando...' : isEditMode ? 'Salvar alteracoes' : 'Criar usuario'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
