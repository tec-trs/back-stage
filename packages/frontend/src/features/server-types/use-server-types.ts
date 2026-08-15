import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface ServerTypeSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useServerTypes(): UseQueryResult<ServerTypeSummary[]> {
  return useQuery({
    queryKey: ['server-types'],
    queryFn: () =>
      apiRequest<{ items: ServerTypeSummary[] }>('/api/server-types').then((r) => r.items),
    staleTime: 1000 * 60 * 5,
  });
}
