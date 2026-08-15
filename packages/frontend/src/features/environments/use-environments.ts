import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export type EnvironmentColor = 'success' | 'warning' | 'danger' | 'default';

export interface EnvironmentSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: EnvironmentColor;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useEnvironments(): UseQueryResult<EnvironmentSummary[]> {
  return useQuery({
    queryKey: ['environments'],
    queryFn: () =>
      apiRequest<{ items: EnvironmentSummary[] }>('/api/environments').then((r) => r.items),
    staleTime: 1000 * 60 * 5,
  });
}
