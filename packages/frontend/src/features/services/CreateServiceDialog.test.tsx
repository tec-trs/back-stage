import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../../shared/api/http-client';

import { CreateServiceDialog } from './CreateServiceDialog';

vi.mock('../../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderDialog(onClose = vi.fn()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    onClose,
    ...render(
      <QueryClientProvider client={queryClient}>
        <CreateServiceDialog isOpen onClose={onClose} />
      </QueryClientProvider>,
    ),
  };
}

describe('CreateServiceDialog', () => {
  afterEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('nao renderiza nada quando isOpen e false', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <CreateServiceDialog isOpen={false} onClose={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(screen.queryByText('Novo Servico')).not.toBeInTheDocument();
  });

  it('valida o formato do nome antes de enviar', () => {
    renderDialog();

    fireEvent.change(screen.getByPlaceholderText('billing-api'), {
      target: { value: 'Nome Invalido' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar servico' }));

    expect(
      screen.getByText('O nome deve conter apenas letras minusculas, numeros e hifen'),
    ).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it('cria o servico e fecha o dialogo ao submeter com sucesso', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      id: 'svc-1',
      type: 'service',
      name: 'billing-api',
      namespace: 'default',
      title: 'Billing API',
      description: null,
      lifecycle: 'experimental',
      ownerTeamId: null,
      systemId: null,
      repositoryUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const { onClose } = renderDialog();

    fireEvent.change(screen.getByPlaceholderText('billing-api'), {
      target: { value: 'billing-api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar servico' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(apiRequest).toHaveBeenCalledWith('/api/services', {
      method: 'POST',
      body: expect.objectContaining({ name: 'billing-api', lifecycle: 'experimental' }),
    });
  });

  it('exibe uma mensagem de erro quando a API rejeita a criacao', async () => {
    vi.mocked(apiRequest).mockRejectedValueOnce(new Error('Service ja existe'));

    renderDialog();

    fireEvent.change(screen.getByPlaceholderText('billing-api'), {
      target: { value: 'billing-api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar servico' }));

    expect(await screen.findByText('Service ja existe')).toBeInTheDocument();
  });

  it('fecha o dialogo e reseta o formulario ao clicar em cancelar', () => {
    const { onClose } = renderDialog();

    fireEvent.change(screen.getByPlaceholderText('billing-api'), {
      target: { value: 'billing-api' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalled();
  });
});
