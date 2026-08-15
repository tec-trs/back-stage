import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { ApplicationTypeSummary } from './use-application-types';

export interface CreateApplicationTypeInput {
  slug: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export function useCreateApplicationType(): UseMutationResult<ApplicationTypeSummary, Error, CreateApplicationTypeInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) =>
      apiRequest<ApplicationTypeSummary>('/api/application-types', { method: 'POST', body: input }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['application-types'] }); },
  });
}
