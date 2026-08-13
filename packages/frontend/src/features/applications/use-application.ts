import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { ApplicationSummary } from './use-applications';

export function useApplication(id: string | undefined): UseQueryResult<ApplicationSummary, Error> {
  return useQuery({
    queryKey: ['applications', id],
    queryFn: () => apiRequest<ApplicationSummary>(`/api/applications/${id}`),
    enabled: Boolean(id),
  });
}
