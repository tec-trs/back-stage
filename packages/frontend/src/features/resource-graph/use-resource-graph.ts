import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client.js';

export interface GraphNode {
  id: string;
  resourceType: 'server' | 'application' | 'database' | 'url';
  label: string;
  status?: string;
  criticality?: string;
  environment?: string;
  hostedOnServerId?: string | null;
  monitoringUrl?: string | null;
}

export interface GraphEdge {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationType: string;
  metadata?: Record<string, unknown>;
}

export interface ImpactNode {
  resourceType: string;
  resourceId: string;
  depth: number;
  label: string;
  status?: string;
  criticality?: string;
}

export interface ImpactResult {
  impactedResources: ImpactNode[];
  hasCycle: boolean;
  totalImpacted: number;
  byType: Record<string, number>;
  byDepth: Record<number, ImpactNode[]>;
}

export interface GraphFilters {
  resourceTypes?: string[];
  environment?: string;
  criticality?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface FullGraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface SubgraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useFullGraph(filters: GraphFilters = {}) {
  return useQuery({
    queryKey: ['resource-graph', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.resourceTypes?.length) params.append('resourceTypes', filters.resourceTypes.join(','));
      if (filters.environment) params.append('environment', filters.environment);
      if (filters.criticality) params.append('criticality', filters.criticality);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

      return apiRequest<FullGraphResponse>(`/resource-graph?${params}`, { method: 'GET' });
    },
  });
}

export function useSubgraph(
  resourceType: 'server' | 'application' | 'database' | 'url' | null,
  resourceId: string | null,
  depth: number = 2,
) {
  return useQuery({
    queryKey: ['resource-graph-subgraph', resourceType, resourceId, depth],
    queryFn: () =>
      apiRequest<SubgraphResponse>(
        `/resource-graph/${resourceType}/${resourceId}/subgraph?depth=${depth}`,
        { method: 'GET' },
      ),
    enabled: !!resourceType && !!resourceId,
  });
}

export function useSimulateImpact() {
  return useMutation({
    mutationFn: async (params: {
      resourceType: 'server' | 'application' | 'database' | 'url';
      resourceId: string;
      maxDepth?: number;
    }) => {
      return apiRequest<ImpactResult>('/resource-graph/simulate-impact', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
}

export function useCreateRelationship() {
  return useMutation({
    mutationFn: async (params: {
      sourceType: string;
      sourceId: string;
      targetType: string;
      targetId: string;
      relationType: string;
      metadata?: Record<string, unknown>;
    }) => {
      return apiRequest<GraphEdge>('/resource-graph/relationships', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  });
}

export function useDeleteRelationship() {
  return useMutation({
    mutationFn: async (relationshipId: string) => {
      return apiRequest<void>(`/resource-graph/relationships/${relationshipId}`, {
        method: 'DELETE',
      });
    },
  });
}
