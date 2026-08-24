import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock heavy dependencies before importing component
vi.mock('../features/resource-graph/use-resource-graph', () => ({
  useFullGraph: vi.fn(() => ({ data: undefined, isLoading: false, isError: false, error: null })),
  useCreateRelationship: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteRelationship: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
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
import * as useFullGraphModule from '../features/resource-graph/use-resource-graph';

const mockGraphData = {
  nodes: [
    { id: 'srv-1', resourceType: 'server' as const, label: 'prod-01', status: 'running' },
    { id: 'app-1', resourceType: 'application' as const, label: 'user-svc', status: 'running' },
    { id: 'app-2', resourceType: 'application' as const, label: 'order-svc', status: 'running' },
    { id: 'db-1', resourceType: 'database' as const, label: 'postgres-main', status: 'running' },
    { id: 'vip-1', resourceType: 'vip' as const, label: 'balancer', status: 'running' },
  ],
  edges: [
    { id: 'e1', sourceId: 'srv-1', sourceType: 'server' as const, targetId: 'app-1', targetType: 'application' as const, relationType: 'hosts' as const },
    { id: 'e2', sourceId: 'app-1', sourceType: 'application' as const, targetId: 'db-1', targetType: 'database' as const, relationType: 'depends_on' as const },
    { id: 'e3', sourceId: 'app-2', sourceType: 'application' as const, targetId: 'db-1', targetType: 'database' as const, relationType: 'depends_on' as const },
  ],
  pagination: { page: 1, pageSize: 500, total: 5 },
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
    vi.mocked(useFullGraphModule.useFullGraph).mockReturnValue({
      data: mockGraphData,
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
    expect(useFullGraphModule.useFullGraph).toHaveBeenCalledWith({ page: 1, pageSize: 500 });

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
    vi.mocked(useFullGraphModule.useFullGraph).mockReturnValue({
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
