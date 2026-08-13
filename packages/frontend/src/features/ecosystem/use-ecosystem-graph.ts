import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { DependencyGraphData } from '../dependency-graph/use-dependency-graph';

export function useEcosystemGraph(): UseQueryResult<DependencyGraphData, Error> {
  return useQuery({
    queryKey: ['ecosystem-graph'],
    queryFn: () => apiRequest<DependencyGraphData>('/api/ecosystem/graph'),
  });
}
