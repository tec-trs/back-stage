import { type FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../features/auth/auth.store';
import { useLogin } from '../features/auth/use-login';
import { ErrorMessage } from '../shared/components/ErrorMessage';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const [email, setEmail] = useState('admin@back-stage.dev');
  const [password, setPassword] = useState('');

  if (accessToken) {
    const state = location.state as LocationState | null;
    return <Navigate to={state?.from?.pathname ?? '/'} replace />;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => navigate('/', { replace: true }) });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-slate-800 p-6"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Platform Engineering Center</h1>
        <p className="mt-1 text-sm text-slate-400">Entre com suas credenciais para continuar</p>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-400">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-400">Senha</span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-slate-500"
        />
      </label>

      {login.isError && (
        <ErrorMessage
          message={login.error instanceof Error ? login.error.message : 'Falha ao autenticar'}
        />
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-white disabled:opacity-60"
      >
        {login.isPending ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
