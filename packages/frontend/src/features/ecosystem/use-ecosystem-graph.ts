import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { EcosystemGraphResponse, EcosystemFilters } from './types';

export function useEcosystemGraph(filters: EcosystemFilters = {}) {
  return useQuery({
    queryKey: ['ecosystem-graph', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.resourceTypes?.length) {
        params.append('resourceTypes', filters.resourceTypes.join(','));
      }
      if (filters.environment) {
        params.append('environment', filters.environment);
      }
      if (filters.page) {
        params.append('page', String(filters.page));
      }
      if (filters.pageSize) {
        params.append('pageSize', String(filters.pageSize));
      }

      return apiRequest<EcosystemGraphResponse>(`/api/ecosystem/graph?${params}`, {
        method: 'GET',
      });
    },
  });
}
