import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { ServiceSummary } from './use-services';

export function useService(id: string | undefined): UseQueryResult<ServiceSummary, Error> {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => apiRequest<ServiceSummary>(`/api/services/${id}`),
    enabled: Boolean(id),
  });
}
