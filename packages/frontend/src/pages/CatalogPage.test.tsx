import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../shared/api/http-client';

import { CatalogPage } from './CatalogPage';

vi.mock('../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderCatalogPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CatalogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CatalogPage', () => {
  it('exibe um estado vazio quando nao ha servicos', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    });

    renderCatalogPage();

    expect(await screen.findByText('Nenhum servico encontrado')).toBeInTheDocument();
  });

  it('lista os servicos retornados pela API', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [
        {
          id: 'svc-1',
          type: 'service',
          name: 'backend-api',
          namespace: 'default',
          title: 'Backend API',
          description: null,
          lifecycle: 'production',
          ownerTeamId: null,
          systemId: null,
          repositoryUrl: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1 },
    });

    renderCatalogPage();

    expect(await screen.findByText('Backend API')).toBeInTheDocument();
    expect(screen.getByText('Produção')).toBeInTheDocument();
  });

  it('abre o dialogo de criacao ao clicar em "+ Novo Servico"', async () => {
    vi.mocked(apiRequest).mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    });

    renderCatalogPage();

    fireEvent.click(await screen.findByRole('button', { name: '+ Novo Servico' }));

    expect(screen.getByText('Novo Servico')).toBeInTheDocument();
  });
});
