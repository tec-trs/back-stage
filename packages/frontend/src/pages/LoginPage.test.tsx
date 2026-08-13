import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../features/auth/auth.store';
import { apiRequest } from '../shared/api/http-client';

import { LoginPage } from './LoginPage';

vi.mock('../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: null, user: null });
    vi.mocked(apiRequest).mockReset();
  });

  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null });
  });

  it('renderiza o formulario de login', () => {
    renderLoginPage();
    expect(screen.getByText('Platform Engineering Center')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument();
  });

  it('autentica e armazena a sessao ao submeter com sucesso', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      accessToken: 'token-123',
      user: { id: '1', email: 'admin@back-stage.dev', fullName: 'Admin', roles: ['admin'] },
    });

    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'ChangeMe123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('token-123');
    });
  });

  it('exibe uma mensagem de erro quando o login falha', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('Credenciais invalidas'));

    renderLoginPage();
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-errada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByText('Credenciais invalidas')).toBeInTheDocument();
  });
});
