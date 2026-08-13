import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../../shared/api/http-client';

import { ApplicationFormDialog } from './ApplicationFormDialog';

vi.mock('../../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderDialog(props: Partial<Parameters<typeof ApplicationFormDialog>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onClose = vi.fn();
  return {
    onClose,
    ...render(
      <QueryClientProvider client={queryClient}>
        <ApplicationFormDialog isOpen onClose={onClose} application={null} {...props} />
      </QueryClientProvider>,
    ),
  };
}

describe('ApplicationFormDialog', () => {
  afterEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('exibe o titulo "Incluir Aplicacao" no modo criacao', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 50, total: 0 } });
    renderDialog();
    expect(screen.getByText('Incluir Aplicacao')).toBeInTheDocument();
  });

  it('valida o formato do codigo antes de enviar', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 50, total: 0 } });
    renderDialog();

    fireEvent.change(screen.getByPlaceholderText('billing-api'), {
      target: { value: 'Codigo Invalido!' },
    });
    fireEvent.change(screen.getByPlaceholderText('Billing API'), {
      target: { value: 'Billing API' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar aplicacao' }));

    expect(
      screen.getByText(
        'O codigo deve conter apenas letras minusculas, numeros, ponto, hifen e underscore',
      ),
    ).toBeInTheDocument();
  });

  it('bloqueia o codigo no modo edicao', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ items: [], pagination: { page: 1, pageSize: 50, total: 0 } });
    renderDialog({
      application: {
        id: 'app-1',
        code: 'billing-api',
        displayName: 'Billing API',
        description: null,
        appType: 'api_backend',
        businessCategory: null,
        criticality: 'high',
        status: 'active',
        language: null,
        framework: null,
        currentVersion: null,
        repositoryUrl: null,
        cicdUrl: null,
        containerImage: null,
        dataClassification: null,
        authMethod: null,
        ownerTeam: null,
        ownerUserId: null,
        costCenter: null,
        monthlyCostEstimate: null,
        docsUrl: null,
        apiSpecUrl: null,
        runbookUrl: null,
        monitoringUrl: null,
        sla: null,
        healthCheckUrl: null,
        metadata: {},
        deployments: [],
        dependsOn: [],
        dependents: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(screen.getByText('Editar Aplicacao')).toBeInTheDocument();
    expect(screen.getByDisplayValue('billing-api')).toBeDisabled();
  });

  it('cria uma aplicacao com sucesso', async () => {
    vi.mocked(apiRequest).mockImplementation((path: string) => {
      if (path === '/api/servers') {
        return Promise.resolve({ items: [], pagination: { page: 1, pageSize: 50, total: 0 } });
      }
      if (path === '/api/applications') {
        return Promise.resolve({ items: [], pagination: { page: 1, pageSize: 50, total: 0 } });
      }
      return Promise.resolve({});
    });

    const { onClose } = renderDialog();

    fireEvent.change(screen.getByPlaceholderText('billing-api'), {
      target: { value: 'billing-api' },
    });
    fireEvent.change(screen.getByPlaceholderText('Billing API'), {
      target: { value: 'Billing API' },
    });

    vi.mocked(apiRequest).mockResolvedValueOnce({ id: 'app-1', code: 'billing-api' });
    fireEvent.click(screen.getByRole('button', { name: 'Criar aplicacao' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
