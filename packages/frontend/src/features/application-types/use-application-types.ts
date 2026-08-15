import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface ApplicationTypeSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useApplicationTypes(): UseQueryResult<ApplicationTypeSummary[]> {
  return useQuery({
    queryKey: ['application-types'],
    queryFn: () =>
      apiRequest<{ items: ApplicationTypeSummary[] }>('/api/application-types').then((r) => r.items),
    staleTime: 1000 * 60 * 5,
  });
}
