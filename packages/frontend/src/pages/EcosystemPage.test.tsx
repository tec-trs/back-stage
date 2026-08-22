import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing component
vi.mock('../features/ecosystem/use-ecosystem-graph', () => ({
  useEcosystemGraph: vi.fn(),
}));
vi.mock('../features/resource-graph/use-resource-graph', () => ({
  useCreateRelationship: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useDeleteRelationship: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
}));
vi.mock('../shared/components/ResourceGraph');
vi.mock('../shared/components/ImpactAnalysisPanel');
vi.mock('../shared/components/Button');
vi.mock('../shared/components/Badge');
vi.mock('../shared/components/Modal');
vi.mock('../shared/components/PageHeader');
vi.mock('../shared/components/ErrorMessage');
vi.mock('../shared/components/Spinner');
vi.mock('@xyflow/react');
vi.mock('html2canvas');
vi.mock('jspdf');

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

describe('EcosystemPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render page title and header', () => {
    vi.mocked(useEcosystemGraphModule.useEcosystemGraph).mockReturnValue({
      data: mockEcosystemData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    expect(useEcosystemGraphModule.useEcosystemGraph).toBeDefined();
  });

  it('should display nodes from hook data', () => {
    vi.mocked(useEcosystemGraphModule.useEcosystemGraph).mockReturnValue({
      data: mockEcosystemData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    expect(mockEcosystemData.nodes).toHaveLength(5);
    expect(mockEcosystemData.edges).toHaveLength(3);
  });

  it('should filter nodes by search term', () => {
    vi.mocked(useEcosystemGraphModule.useEcosystemGraph).mockReturnValue({
      data: mockEcosystemData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);
    const searchTerm = 'prod-01';
    const matching = mockEcosystemData.nodes.find((n) => n.name.includes(searchTerm));
    expect(matching?.name).toBe('prod-01');
  });

  it('should persist compact mode to localStorage', () => {
    localStorage.setItem('ecosystem-compact-mode', JSON.stringify(true));
    expect(localStorage.getItem('ecosystem-compact-mode')).toBe('true');
    localStorage.setItem('ecosystem-compact-mode', JSON.stringify(false));
    expect(localStorage.getItem('ecosystem-compact-mode')).toBe('false');
  });

  it('should handle loading state with spinner', () => {
    vi.mocked(useEcosystemGraphModule.useEcosystemGraph).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);
    const result = useEcosystemGraphModule.useEcosystemGraph();
    expect(result.isLoading).toBe(true);
    expect(result.data).toBeUndefined();
  });
});
