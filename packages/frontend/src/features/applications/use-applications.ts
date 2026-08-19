import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export type AppType =
  | 'web_app'
  | 'api_backend'
  | 'mobile'
  | 'batch_job'
  | 'microservice'
  | 'monolith'
  | 'internal_library'
  | 'middleware';
export type Criticality = 'critical' | 'high' | 'medium' | 'low';
export type ApplicationStatus = 'developing' | 'active' | 'maintenance' | 'deprecated' | 'deactivated';
export type DeployEnvironment = string;

export interface ApplicationDeployment {
  id: string;
  serverId: string;
  serverHostname: string | null;
  environment: DeployEnvironment;
  deployMethod: string | null;
  accessUrl: string | null;
  ports: string[];
  deployedVersion: string | null;
  lastDeployedAt: string | null;
}

export interface ApplicationDependencyRef {
  id: string;
  code: string;
  displayName: string;
}

export interface ApplicationSummary {
  id: string;
  code: string;
  displayName: string;
  description: string | null;
  appType: AppType;
  businessCategory: string | null;
  criticality: Criticality;
  status: ApplicationStatus;
  language: string | null;
  framework: string | null;
  currentVersion: string | null;
  repositoryUrl: string | null;
  cicdUrl: string | null;
  containerImage: string | null;
  dataClassification: string | null;
  authMethod: string | null;
  ownerTeam: string | null;
  ownerUserId: string | null;
  costCenter: string | null;
  monthlyCostEstimate: number | null;
  docsUrl: string | null;
  apiSpecUrl: string | null;
  runbookUrl: string | null;
  monitoringUrl: string | null;
  sla: string | null;
  healthCheckUrl: string | null;
  metadata: Record<string, unknown>;
  deployments: ApplicationDeployment[];
  dependsOn: ApplicationDependencyRef[];
  dependents: ApplicationDependencyRef[];
  createdAt: string;
  updatedAt: string;
}

interface ListApplicationsResponse {
  items: ApplicationSummary[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useApplications(page = 1): UseQueryResult<ListApplicationsResponse, Error> {
  return useQuery({
    queryKey: ['applications', page],
    queryFn: () =>
      apiRequest<ListApplicationsResponse>('/api/applications', { query: { page, pageSize: 50 } }),
  });
}

export function useAllApplications(): UseQueryResult<ApplicationSummary[], Error> {
  return useQuery({
    queryKey: ['applications-all'],
    queryFn: async () => {
      let allItems: ApplicationSummary[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiRequest<ListApplicationsResponse>('/api/applications', {
          query: { page, pageSize: 100 },
        });
        allItems = allItems.concat(response.items);
        hasMore = response.pagination.page * response.pagination.pageSize < response.pagination.total;
        page++;
      }

      return allItems;
    },
  });
}
