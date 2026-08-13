import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../features/auth/auth.store';
import { apiRequest } from '../shared/api/http-client';

import { UsersPage } from './UsersPage';

vi.mock('../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderUsersPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UsersPage />
    </QueryClientProvider>,
  );
}

const ADMIN_USER = {
  id: 'admin-1',
  email: 'admin@back-stage.dev',
  fullName: 'Administrador',
  roles: ['admin'],
};

describe('UsersPage', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null });
    vi.mocked(apiRequest).mockReset();
  });

  it('exibe mensagem de acesso negado para usuarios sem perfil admin', () => {
    useAuthStore.setState({
      accessToken: 'token',
      user: { id: 'viewer-1', email: 'v@back-stage.dev', fullName: 'Viewer', roles: ['viewer'] },
    });

    renderUsersPage();

    expect(
      screen.getByText('Apenas administradores podem gerenciar usuarios.'),
    ).toBeInTheDocument();
  });

  it('lista os usuarios retornados pela API para um admin', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [
        {
          id: 'user-1',
          email: 'jane.doe@back-stage.dev',
          fullName: 'Jane Doe',
          avatarUrl: null,
          isActive: true,
          roles: ['viewer'],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });

    renderUsersPage();

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Visualizador')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
  });

  it('desabilita a acao de inativar para o proprio usuario autenticado', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [
        {
          id: 'admin-1',
          email: 'admin@back-stage.dev',
          fullName: 'Administrador',
          avatarUrl: null,
          isActive: true,
          roles: ['admin'],
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });

    renderUsersPage();

    const deactivateButton = await screen.findByRole('button', { name: 'Inativar' });
    expect(deactivateButton).toBeDisabled();
  });

  it('abre o dialogo de criacao ao clicar em "+ Novo Usuario"', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    });

    renderUsersPage();

    fireEvent.click(await screen.findByRole('button', { name: '+ Novo Usuario' }));

    await waitFor(() => {
      expect(screen.getByText('Novo Usuario')).toBeInTheDocument();
    });
  });
});
