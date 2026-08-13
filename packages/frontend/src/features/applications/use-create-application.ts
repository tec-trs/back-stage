import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type {
  ApplicationStatus,
  ApplicationSummary,
  AppType,
  Criticality,
  DeployEnvironment,
} from './use-applications';

export interface DeploymentInput {
  serverId: string;
  environment: DeployEnvironment;
  deployMethod?: string | null;
  accessUrl?: string | null;
  deployedVersion?: string | null;
}

export interface CreateApplicationInput {
  code: string;
  displayName: string;
  description?: string | null;
  appType: AppType;
  businessCategory?: string | null;
  criticality?: Criticality;
  status?: ApplicationStatus;
  language?: string | null;
  framework?: string | null;
  currentVersion?: string | null;
  repositoryUrl?: string | null;
  cicdUrl?: string | null;
  containerImage?: string | null;
  dataClassification?: string | null;
  authMethod?: string | null;
  ownerTeam?: string | null;
  costCenter?: string | null;
  monthlyCostEstimate?: number | null;
  docsUrl?: string | null;
  apiSpecUrl?: string | null;
  runbookUrl?: string | null;
  monitoringUrl?: string | null;
  sla?: string | null;
  healthCheckUrl?: string | null;
  deployments?: DeploymentInput[];
  dependsOnIds?: string[];
}

export function useCreateApplication(): UseMutationResult<
  ApplicationSummary,
  Error,
  CreateApplicationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      apiRequest<ApplicationSummary>('/api/applications', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
