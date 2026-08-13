import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../shared/api/http-client';

import { ApplicationsPage } from './ApplicationsPage';

vi.mock('../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderApplicationsPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const APPLICATION_ITEM = {
  id: 'app-1',
  code: 'billing-api',
  displayName: 'Billing API',
  description: null,
  appType: 'api_backend',
  businessCategory: null,
  criticality: 'high',
  status: 'active',
  language: 'TypeScript',
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
};

function mockApi(items: unknown[] = [APPLICATION_ITEM]) {
  vi.mocked(apiRequest).mockImplementation((path: string) => {
    if (path === '/api/applications') {
      return Promise.resolve({ items, pagination: { page: 1, pageSize: 50, total: items.length } });
    }
    if (path === '/api/servers') {
      return Promise.resolve({ items: [], pagination: { page: 1, pageSize: 50, total: 0 } });
    }
    return Promise.reject(new Error(`unexpected path: ${path}`));
  });
}

describe('ApplicationsPage', () => {
  afterEach(() => {
    vi.mocked(apiRequest).mockReset();
  });

  it('exibe um estado vazio quando nao ha aplicacoes', async () => {
    mockApi([]);
    renderApplicationsPage();

    expect(await screen.findByText('Nenhuma aplicacao encontrada')).toBeInTheDocument();
  });

  it('lista aplicacoes e mantem as acoes desabilitadas sem selecao', async () => {
    mockApi();
    renderApplicationsPage();

    expect(await screen.findByText('Billing API')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
  });

  it('habilita as acoes ao selecionar uma aplicacao', async () => {
    mockApi();
    renderApplicationsPage();

    fireEvent.click(await screen.findByRole('radio', { name: 'Selecionar Billing API' }));

    expect(screen.getByRole('button', { name: 'Editar' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeEnabled();
  });

  it('abre o dialogo de criacao ao clicar em "Incluir Aplicacao"', async () => {
    mockApi([]);
    renderApplicationsPage();

    fireEvent.click(await screen.findByRole('button', { name: 'Incluir Aplicacao' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Incluir Aplicacao' })).toBeInTheDocument();
    });
  });
});
