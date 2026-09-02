import { useAuthStore } from '../features/auth/auth.store';
import { Badge } from '../shared/components/Badge';
import { PageHeader } from '../shared/components/PageHeader';
import { translateRole } from '../shared/constants/labels';

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <PageHeader title="Configuracoes" description="Informacoes da conta autenticada" />

      {user && (
        <dl className="grid max-w-lg grid-cols-2 gap-4 rounded border border-line p-4 text-sm">
          <dt className="text-slate-500">Nome</dt>
          <dd>{user.fullName}</dd>
          <dt className="text-slate-500">Codigo de usuario</dt>
          <dd className="font-mono">{user.code}</dd>
          <dt className="text-slate-500">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-slate-500">Perfis</dt>
          <dd className="flex flex-wrap gap-1">
            {user.roles.map((role) => (
              <Badge key={role}>{translateRole(role)}</Badge>
            ))}
          </dd>
        </dl>
      )}
    </div>
  );
}
