import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client.js';
import { resourceGraphQueryPredicate } from '../../shared/api/query-helpers.js';

export interface GraphNode {
  id: string;
  resourceType: 'server' | 'application' | 'database' | 'url' | 'vip';
  label: string;
  status?: string;
  criticality?: string;
  environment?: string;
  hostedOnServerId?: string | null;
  monitoringUrl?: string | null;
  displayGroup?: string | null;
}

export interface GraphEdge {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationType: string;
  metadata?: Record<string, unknown>;
  reason?: string | null;
  createdByUserId?: string | null;
  createdByName?: string | null;
  createdAt?: string;
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

      return apiRequest<FullGraphResponse>(`/api/resource-graph?${params}`, { method: 'GET' });
    },
  });
}

export function useSubgraph(
  resourceType: 'server' | 'application' | 'database' | 'url' | 'vip' | null,
  resourceId: string | null,
  depth: number = 2,
) {
  const getDirectionAndDepth = (type: string | null, requestedDepth: number): { direction: 'upstream' | 'downstream' | 'both'; depth: number } => {
    switch (type) {
      case 'url':
        return { direction: 'upstream', depth: 1 };
      case 'application':
        return { direction: 'downstream', depth: requestedDepth };
      case 'server':
        return { direction: 'upstream', depth: requestedDepth };
      case 'database':
        return { direction: 'upstream', depth: requestedDepth };
      default:
        return { direction: 'both', depth: requestedDepth };
    }
  };

  const { direction, depth: finalDepth } = getDirectionAndDepth(resourceType, depth);

  return useQuery({
    queryKey: ['resource-graph-subgraph', resourceType, resourceId, finalDepth, direction],
    queryFn: () =>
      apiRequest<SubgraphResponse>(
        `/api/resource-graph/${resourceType}/${resourceId}/subgraph?depth=${finalDepth}&direction=${direction}`,
        { method: 'GET' },
      ),
    enabled: !!resourceType && !!resourceId,
  });
}

export function useSimulateImpact() {
  return useMutation({
    mutationFn: async (params: {
      resourceType: 'server' | 'application' | 'database' | 'url' | 'vip';
      resourceId: string;
      maxDepth?: number;
    }) => {
      return apiRequest<ImpactResult>('/api/resource-graph/simulate-impact', {
        method: 'POST',
        body: params,
      });
    },
  });
}

export interface CreateRelationshipInput {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  relationType: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}

export function useResourceRelationships(
  sourceType: string | null,
  sourceId: string | null,
  relationType?: string,
) {
  return useQuery({
    queryKey: ['resource-graph-relationships', sourceType, sourceId, relationType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sourceType) params.append('sourceType', sourceType);
      if (sourceId)   params.append('sourceId',   sourceId);
      if (relationType) params.append('relationType', relationType);
      return apiRequest<{ items: GraphEdge[] }>(`/api/resource-graph/relationships?${params}`).then(
        (r) => r.items,
      );
    },
    enabled: !!sourceType && !!sourceId,
    staleTime: 0,
  });
}

export function useAllRelationships(filters?: {
  relationType?: string;
  resourceType?: string;
}) {
  return useQuery({
    queryKey: ['resource-graph-all-relationships', filters?.relationType, filters?.resourceType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.relationType) params.append('relationType', filters.relationType);
      return apiRequest<{ items: GraphEdge[] }>(`/api/resource-graph/relationships?${params}`).then(
        (r) => r.items,
      );
    },
    staleTime: 0, // Always fetch fresh to reflect recent changes
  });
}

export function useCriticalResources() {
  return useQuery({
    queryKey: ['resource-graph-critical-resources'],
    queryFn: () => apiRequest<any[]>('/api/resource-graph/critical-resources'),
    staleTime: 120000,
  });
}

export function useCreateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateRelationshipInput) =>
      apiRequest<GraphEdge>('/api/resource-graph/relationships', {
        method: 'POST',
        body: params,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ predicate: resourceGraphQueryPredicate });
    },
  });
}

export function useDeleteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (relationshipId: string) =>
      apiRequest<void>(`/api/resource-graph/relationships/${relationshipId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ predicate: resourceGraphQueryPredicate });
    },
  });
}
