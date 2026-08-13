import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface ServiceSummary {
  id: string;
  type: string;
  name: string;
  namespace: string;
  title: string | null;
  description: string | null;
  lifecycle: string;
  ownerTeamId: string | null;
  systemId: string | null;
  repositoryUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListServicesResponse {
  items: ServiceSummary[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useServices(page = 1): UseQueryResult<ListServicesResponse, Error> {
  return useQuery({
    queryKey: ['services', page],
    queryFn: () =>
      apiRequest<ListServicesResponse>('/api/services', { query: { page, pageSize: 20 } }),
  });
}
