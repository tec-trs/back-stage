import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface ComplianceDashboard {
  totalPolicies: number;
  activePolicies: number;
  totalEvaluations: number;
  passCount: number;
  failCount: number;
  warningCount: number;
  openExemptions: number;
}

export function useGovernanceDashboard(): UseQueryResult<ComplianceDashboard, Error> {
  return useQuery({
    queryKey: ['governance', 'dashboard'],
    queryFn: () => apiRequest<ComplianceDashboard>('/api/governance/dashboard'),
  });
}
