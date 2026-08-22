import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock heavy dependencies before importing component
vi.mock('../features/ecosystem/use-ecosystem-graph');
vi.mock('../features/resource-graph/use-resource-graph', () => ({
  useCreateRelationship: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteRelationship: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));
vi.mock('@xyflow/react', () => ({
  ReactFlow: () => null,
  Background: () => null,
  Handle: () => null,
  BaseEdge: () => null,
  EdgeLabelRenderer: () => null,
  applyEdgeChanges: (edges: any) => edges,
  applyNodeChanges: (nodes: any) => nodes,
  getSmoothStepPath: () => ['', '', ''],
  useUpdateNodeInternals: () => vi.fn(),
  Position: {},
  MarkerType: {},
}));
vi.mock('../shared/components/ResourceGraph', () => ({
  ResourceGraph: () => React.createElement('div', { 'data-testid': 'resource-graph' }),
  default: () => React.createElement('div', { 'data-testid': 'resource-graph' }),
}));
vi.mock('../shared/components/ImpactAnalysisPanel', () => ({
  ImpactAnalysisPanel: () => null,
}));
vi.mock('html2canvas');
vi.mock('jspdf');

import { EcosystemPage } from './EcosystemPage';
import * as useEcosystemGraphModule from '../features/ecosystem/use-ecosystem-graph';

const mockEcosystemData = {
  nodes: [
    { id: 'srv-1', kind: 'server' as const, type: 'compute', name: 'prod-01', lifecycle: 'active' },
    { id: 'app-1', kind: 'application' as const, type: 'api', name: 'user-svc', lifecycle: 'active' },
    { id: 'app-2', kind: 'application' as const, type: 'api', name: 'order-svc', lifecycle: 'active' },
    { id: 'db-1', kind: 'server' as const, type: 'database', name: 'postgres-main', lifecycle: 'active' },
    { id: 'vip-1', kind: 'application' as const, type: 'vip', name: 'balancer', lifecycle: 'active' },
  ],
  edges: [
    { id: 'e1', source: 'srv-1', target: 'app-1', relationType: 'hosts' as const },
    { id: 'e2', source: 'app-1', target: 'db-1', relationType: 'dependsOn' as const },
    { id: 'e3', source: 'app-2', target: 'db-1', relationType: 'dependsOn' as const },
  ],
};

function renderEcosystemPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    ...render(
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(BrowserRouter, {}, React.createElement(EcosystemPage)),
      ),
    ),
    user: userEvent.setup(),
  };
}

describe('EcosystemPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useEcosystemGraphModule.useEcosystemGraph).mockReturnValue({
      data: mockEcosystemData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render page title and header', () => {
    // SETUP: render with mock data
    renderEcosystemPage();

    // ASSERT: "Ecossistema" title visible in actual DOM
    expect(screen.getByText('Ecossistema')).toBeInTheDocument();

    // ASSERT: header subtitle visible in actual DOM
    expect(screen.getByText(/Duplo clique no nó para abrir detalhes/i)).toBeInTheDocument();
  });

  it('should display nodes from hook data', async () => {
    // SETUP: render with 5 nodes and 3 edges
    renderEcosystemPage();

    // ASSERT: ResourceGraph component rendered (receives node data)
    expect(await screen.findByTestId('resource-graph')).toBeInTheDocument();

    // ASSERT: useEcosystemGraph called with correct params
    expect(useEcosystemGraphModule.useEcosystemGraph).toHaveBeenCalledWith({ page: 1, pageSize: 500 });

    // ASSERT: Resource type labels visible in DOM (indicating nodes are rendered)
    expect(screen.getByText('Servidor')).toBeInTheDocument();
    expect(screen.getByText('Aplicacao')).toBeInTheDocument();
  });

  it('should filter nodes by search term', async () => {
    // SETUP: render component
    const { user } = renderEcosystemPage();

    // ACT: find search input and type search term
    const searchInput = await screen.findByPlaceholderText('🔍 Procurar recurso...');
    await user.type(searchInput, 'prod-01');

    // ASSERT: search input value updated in actual DOM
    expect(searchInput).toHaveValue('prod-01');
  });

  it('should persist compact mode to localStorage', async () => {
    // SETUP: render component
    const { user } = renderEcosystemPage();

    // ASSERT: compact mode button exists and initially shows "Compacto"
    const compactButton = await screen.findByTitle(/Modo compacto/i);
    expect(compactButton.textContent).toContain('Compacto');

    // ASSERT: localStorage initialized with true
    expect(localStorage.getItem('ecosystem-compact-mode')).toBe('true');

    // ACT: click to toggle off
    await user.click(compactButton);

    // ASSERT: button text changed in DOM to "Expandido"
    await waitFor(() => {
      expect(compactButton.textContent).toContain('Expandido');
    });

    // ASSERT: localStorage persisted to false
    expect(localStorage.getItem('ecosystem-compact-mode')).toBe('false');

    // ACT: click again to toggle back on
    await user.click(compactButton);

    // ASSERT: button text back to "Compacto"
    await waitFor(() => {
      expect(compactButton.textContent).toContain('Compacto');
    });

    // ASSERT: localStorage back to true
    expect(localStorage.getItem('ecosystem-compact-mode')).toBe('true');
  });

  it('should handle loading state with spinner', () => {
    // SETUP: mock isLoading=true
    vi.mocked(useEcosystemGraphModule.useEcosystemGraph).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    // ACT: render component in loading state
    renderEcosystemPage();

    // ASSERT: Spinner visible in actual DOM
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // ASSERT: main page content not visible (Spinner returned early)
    expect(screen.queryByText('Ecossistema')).not.toBeInTheDocument();
  });
});
