import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { apiRequest } from '../shared/api/http-client';

import { GovernancePage } from './GovernancePage';

vi.mock('../shared/api/http-client', () => ({
  apiRequest: vi.fn(),
}));

function renderGovernancePage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <GovernancePage />
    </QueryClientProvider>,
  );
}

describe('GovernancePage', () => {
  it('exibe o resumo de compliance e as violacoes ativas', async () => {
    vi.mocked(apiRequest).mockImplementation((path: string) => {
      if (path === '/api/governance/dashboard') {
        return Promise.resolve({
          totalPolicies: 5,
          activePolicies: 4,
          totalEvaluations: 20,
          passCount: 15,
          failCount: 5,
          warningCount: 0,
          openExemptions: 2,
        });
      }
      if (path === '/api/governance/violations') {
        return Promise.resolve({
          items: [
            {
              id: 'eval-1',
              policyId: 'policy-1',
              entityId: 'entity-1',
              status: 'fail',
              policyName: 'Producao exige owner',
              entityName: 'backend-api',
              evaluatedAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          pagination: { page: 1, pageSize: 20, total: 1 },
        });
      }
      return Promise.reject(new Error(`unexpected path: ${path}`));
    });

    renderGovernancePage();

    expect(await screen.findByText('4')).toBeInTheDocument();
    expect(await screen.findByText('Producao exige owner')).toBeInTheDocument();
    expect(screen.getByText('backend-api')).toBeInTheDocument();
  });

  it('exibe estado vazio quando nao ha violacoes', async () => {
    vi.mocked(apiRequest).mockImplementation((path: string) => {
      if (path === '/api/governance/dashboard') {
        return Promise.resolve({
          totalPolicies: 2,
          activePolicies: 2,
          totalEvaluations: 10,
          passCount: 10,
          failCount: 0,
          warningCount: 0,
          openExemptions: 0,
        });
      }
      return Promise.resolve({ items: [], pagination: { page: 1, pageSize: 20, total: 0 } });
    });

    renderGovernancePage();

    expect(await screen.findByText('Nenhuma violacao ativa')).toBeInTheDocument();
  });
});
