import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { ServerSummary } from './use-servers';

export function useServer(id: string | undefined): UseQueryResult<ServerSummary, Error> {
  return useQuery({
    queryKey: ['servers', id],
    queryFn: () => apiRequest<ServerSummary>(`/api/servers/${id}`),
    enabled: Boolean(id),
  });
}
