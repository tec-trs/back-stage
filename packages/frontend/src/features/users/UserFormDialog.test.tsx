import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../../shared/api/http-client';

import { UserFormDialog } from './UserFormDialog';

vi.mock('../../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderDialog(props: Partial<Parameters<typeof UserFormDialog>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  return {
    onClose,
    ...render(
      <QueryClientProvider client={queryClient}>
        <UserFormDialog isOpen onClose={onClose} user={null} {...props} />
      </QueryClientProvider>,
    ),
  };
}

function fillCreateForm(): void {
  fireEvent.change(screen.getByPlaceholderText('maria.souza'), {
    target: { value: 'jane.doe' },
  });
  fireEvent.change(screen.getByPlaceholderText('Maria Souza'), {
    target: { value: 'Jane Doe' },
  });
  fireEvent.change(screen.getByPlaceholderText('maria.souza@back-stage.dev'), {
    target: { value: 'jane.doe@back-stage.dev' },
  });
  fireEvent.change(screen.getByLabelText('Senha (minimo 8 caracteres) *'), {
    target: { value: 'SenhaForte123!' },
  });
}

describe('UserFormDialog', () => {
  afterEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('exibe o titulo "Novo Usuario" e o campo de senha no modo criacao', () => {
    renderDialog();

    expect(screen.getByText('Novo Usuario')).toBeInTheDocument();
    expect(screen.getByText('Senha (minimo 8 caracteres) *')).toBeInTheDocument();
  });

  it('exibe o titulo "Editar Usuario" e um campo de senha opcional no modo edicao', () => {
    renderDialog({
      user: {
        id: 'user-1',
        code: 'jane.doe',
        email: 'jane.doe@back-stage.dev',
        fullName: 'Jane Doe',
        avatarUrl: null,
        isActive: true,
        roles: ['viewer'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
    const passwordInput = screen.getByLabelText('Nova senha (minimo 8 caracteres)');
    expect(passwordInput).not.toBeRequired();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    const codeInput = screen.getByDisplayValue('jane.doe');
    expect(codeInput).toBeDisabled();
  });

  it('envia a senha somente quando preenchida ao editar um usuario', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: 'user-1',
      code: 'jane.doe',
      email: 'jane.doe@back-stage.dev',
      fullName: 'Jane Doe',
      avatarUrl: null,
      isActive: true,
      roles: ['viewer'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const { onClose } = renderDialog({
      user: {
        id: 'user-1',
        code: 'jane.doe',
        email: 'jane.doe@back-stage.dev',
        fullName: 'Jane Doe',
        avatarUrl: null,
        isActive: true,
        roles: ['viewer'],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salvar alteracoes' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(apiRequest).toHaveBeenCalledWith('/api/users/user-1', {
      method: 'PUT',
      body: expect.objectContaining({ code: 'jane.doe', password: undefined }),
    });
  });

  it('exige pelo menos um perfil selecionado', () => {
    renderDialog();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Visualizador' }));
    fillCreateForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuario' }));

    expect(screen.getByText('Selecione pelo menos um perfil')).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('valida o formato do codigo antes de enviar', () => {
    renderDialog();

    fireEvent.change(screen.getByPlaceholderText('maria.souza'), {
      target: { value: 'Codigo Invalido!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Maria Souza'), {
      target: { value: 'Jane Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText('maria.souza@back-stage.dev'), {
      target: { value: 'jane.doe@back-stage.dev' },
    });
    fireEvent.change(screen.getByLabelText('Senha (minimo 8 caracteres) *'), {
      target: { value: 'SenhaForte123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuario' }));

    expect(
      screen.getByText(
        'O codigo deve conter apenas letras minusculas, numeros, ponto, hifen e underscore',
      ),
    ).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('cria um usuario e fecha o dialogo ao submeter com sucesso', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: 'user-1',
      code: 'jane.doe',
      email: 'jane.doe@back-stage.dev',
      fullName: 'Jane Doe',
      avatarUrl: null,
      isActive: true,
      roles: ['viewer'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const { onClose } = renderDialog();

    fillCreateForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuario' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(apiRequest).toHaveBeenCalledWith('/api/users', {
      method: 'POST',
      body: expect.objectContaining({
        code: 'jane.doe',
        email: 'jane.doe@back-stage.dev',
        roles: ['viewer'],
      }),
    });
  });

  it('exibe uma mensagem de erro quando a API rejeita a criacao', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('Usuario ja existe'));

    renderDialog();

    fillCreateForm();
    fireEvent.click(screen.getByRole('button', { name: 'Criar usuario' }));

    expect(await screen.findByText('Usuario ja existe')).toBeInTheDocument();
  });
});
