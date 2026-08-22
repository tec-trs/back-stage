import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as httpClient from '../../shared/api/http-client';

import { useEcosystemGraph } from './use-ecosystem-graph';

vi.mock('../../shared/api/http-client');

const mockData = {
  nodes: [
    {
      id: 'srv-1',
      kind: 'server' as const,
      type: 'compute',
      name: 'prod-01',
      lifecycle: 'active',
    },
    {
      id: 'app-1',
      kind: 'application' as const,
      type: 'api',
      name: 'user-svc',
      lifecycle: 'active',
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'srv-1',
      target: 'app-1',
      relationType: 'hosts' as const,
    },
  ],
};

describe('useEcosystemGraph', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  it('should return ecosystem graph data on success', async () => {
    vi.mocked(httpClient.apiRequest).mockResolvedValueOnce(mockData);

    const { result } = renderHook(() => useEcosystemGraph(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(httpClient.apiRequest).toHaveBeenCalledOnce();
    expect(httpClient.apiRequest).toHaveBeenCalledWith(
      expect.stringContaining('/api/ecosystem/graph'),
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Network error');
    vi.mocked(httpClient.apiRequest).mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useEcosystemGraph(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
    expect(httpClient.apiRequest).toHaveBeenCalledOnce();
  });

  it('should pass filters as query parameters', async () => {
    vi.mocked(httpClient.apiRequest).mockResolvedValueOnce(mockData);

    const filters = {
      resourceTypes: ['server'],
      page: 1,
    };

    const { result } = renderHook(() => useEcosystemGraph(filters), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const callUrl = vi.mocked(httpClient.apiRequest).mock.calls[0][0];
    expect(callUrl).toContain('resourceTypes=server');
    expect(callUrl).toContain('page=1');
  });
});
