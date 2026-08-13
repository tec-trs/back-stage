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
  code: 'admin',
  email: 'admin@back-stage.dev',
  fullName: 'Administrador',
  roles: ['admin'],
};

const JANE_DOE_ITEM = {
  id: 'user-1',
  code: 'jane.doe',
  email: 'jane.doe@back-stage.dev',
  fullName: 'Jane Doe',
  avatarUrl: null,
  isActive: true,
  roles: ['viewer'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const ADMIN_ITEM = {
  id: 'admin-1',
  code: 'admin',
  email: 'admin@back-stage.dev',
  fullName: 'Administrador',
  avatarUrl: null,
  isActive: true,
  roles: ['admin'],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('UsersPage', () => {
  afterEach(() => {
    useAuthStore.setState({ accessToken: null, user: null });
    vi.mocked(apiRequest).mockReset();
  });

  it('exibe mensagem de acesso negado para usuarios sem perfil admin', () => {
    useAuthStore.setState({
      accessToken: 'token',
      user: {
        id: 'viewer-1',
        code: 'viewer',
        email: 'v@back-stage.dev',
        fullName: 'Viewer',
        roles: ['viewer'],
      },
    });

    renderUsersPage();

    expect(
      screen.getByText('Apenas administradores podem gerenciar usuarios.'),
    ).toBeInTheDocument();
  });

  it('lista os usuarios retornados pela API e mantem as acoes desabilitadas sem selecao', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [JANE_DOE_ITEM],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });

    renderUsersPage();

    expect(await screen.findByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Visualizador')).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Inativar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
  });

  it('habilita as acoes ao selecionar um usuario diferente do autenticado', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [JANE_DOE_ITEM],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });

    renderUsersPage();

    fireEvent.click(await screen.findByRole('radio', { name: 'Selecionar Jane Doe' }));

    expect(screen.getByRole('button', { name: 'Editar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Inativar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeEnabled();
  });

  it('desabilita inativar e eliminar quando o proprio usuario autenticado esta selecionado', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [ADMIN_ITEM],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });

    renderUsersPage();

    fireEvent.click(await screen.findByRole('radio', { name: 'Selecionar Administrador' }));

    expect(screen.getByRole('button', { name: 'Editar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Inativar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
  });

  it('elimina o usuario selecionado apos confirmacao', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [JANE_DOE_ITEM],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });
    vi.mocked(apiRequest).mockResolvedValueOnce(undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderUsersPage();

    fireEvent.click(await screen.findByRole('radio', { name: 'Selecionar Jane Doe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/users/user-1', { method: 'DELETE' });
    });
    confirmSpy.mockRestore();
  });

  it('nao elimina o usuario quando a confirmacao e cancelada', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [JANE_DOE_ITEM],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderUsersPage();

    fireEvent.click(await screen.findByRole('radio', { name: 'Selecionar Jane Doe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(apiRequest).toHaveBeenCalledTimes(1);
    confirmSpy.mockRestore();
  });

  it('abre o dialogo de edicao com o usuario selecionado ao clicar em Editar', async () => {
    useAuthStore.setState({ accessToken: 'token', user: ADMIN_USER });
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [JANE_DOE_ITEM],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });

    renderUsersPage();

    fireEvent.click(await screen.findByRole('radio', { name: 'Selecionar Jane Doe' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    await waitFor(() => {
      expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
    });
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
