import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { EnvironmentColor, EnvironmentSummary } from './use-environments';

export interface CreateEnvironmentInput {
  slug: string;
  name: string;
  description?: string | null;
  color?: EnvironmentColor;
  isActive?: boolean;
}

export function useCreateEnvironment(): UseMutationResult<EnvironmentSummary, Error, CreateEnvironmentInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) =>
      apiRequest<EnvironmentSummary>('/api/environments', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['environments'] });
    },
  });
}
