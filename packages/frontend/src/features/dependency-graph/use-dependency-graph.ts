import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface GraphNode {
  id: string;
  kind: string;
  type: string;
  name: string;
  title: string | null;
  lifecycle: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: string;
}

export interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useDependencyGraph(): UseQueryResult<DependencyGraphData, Error> {
  return useQuery({
    queryKey: ['dependency-graph'],
    queryFn: () => apiRequest<DependencyGraphData>('/api/catalog-entities/graph'),
  });
}
