import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { OrgPickerDialog } from '../features/auth/OrgPickerDialog';
import { useAuthStore } from '../features/auth/auth.store';
import { useLogin } from '../features/auth/use-login';
import { Button } from '../shared/components/Button';
import { ErrorMessage } from '../shared/components/ErrorMessage';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const [code, setCode] = useState('admin');
  const [password, setPassword] = useState('');

  if (accessToken) {
    const state = location.state as LocationState | null;
    return <Navigate to={state?.from?.pathname ?? '/'} replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    login.mutate(
      { code, password },
      {
        onSuccess: (data) => {
          if (data.status === 'ok') {
            navigate('/', { replace: true });
          }
          // if status === 'select_org', the dialog renders below
        },
      },
    );
  }

  const isSelectOrg = login.isSuccess && login.data.status === 'select_org';

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rack-ticks flex w-full max-w-sm flex-col gap-4 rounded border border-line bg-surface/50 p-6 pb-7"
      >
        <div>
          <h1 className="font-mono text-lg font-bold leading-tight text-slate-100">
            BACK<span className="text-signal">·</span>STAGE
          </h1>
          <p className="mt-1 text-sm text-slate-400">Entre com suas credenciais para continuar</p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-mono text-xs uppercase tracking-wide text-slate-500">Codigo de usuario</span>
          <input
            type="text"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-signal"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-mono text-xs uppercase tracking-wide text-slate-500">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded border border-line bg-canvas px-3 py-2 text-slate-100 outline-none focus:border-signal"
          />
        </label>

        {login.isError && (
          <ErrorMessage
            message={login.error instanceof Error ? login.error.message : 'Falha ao autenticar'}
          />
        )}

        <Button type="submit" disabled={login.isPending} className="w-full">
          {login.isPending ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      {isSelectOrg && login.data.status === 'select_org' && (
        <OrgPickerDialog
          pendingToken={login.data.pendingToken}
          organizations={login.data.organizations}
          onSuccess={() => navigate('/', { replace: true })}
          onCancel={() => login.reset()}
        />
      )}
    </>
  );
}
