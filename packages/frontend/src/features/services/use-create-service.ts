import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { ServiceSummary } from './use-services';

export interface CreateServiceInput {
  type: string;
  name: string;
  namespace: string;
  title?: string | null;
  description?: string | null;
  lifecycle: 'experimental' | 'production' | 'deprecated';
  repositoryUrl?: string | null;
}

export function useCreateService(): UseMutationResult<
  ServiceSummary,
  Error,
  CreateServiceInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateServiceInput) =>
      apiRequest<ServiceSummary>('/api/services', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
