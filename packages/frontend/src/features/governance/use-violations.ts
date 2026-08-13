import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface PolicyViolation {
  id: string;
  policyId: string;
  entityId: string;
  status: string;
  policyName?: string;
  entityName?: string;
  evaluatedAt: string;
}

interface ListViolationsResponse {
  items: PolicyViolation[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useViolations(): UseQueryResult<ListViolationsResponse, Error> {
  return useQuery({
    queryKey: ['governance', 'violations'],
    queryFn: () => apiRequest<ListViolationsResponse>('/api/governance/violations'),
  });
}
