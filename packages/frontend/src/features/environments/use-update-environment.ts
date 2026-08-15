import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { EnvironmentColor, EnvironmentSummary } from './use-environments';

export interface UpdateEnvironmentInput {
  id: string;
  name?: string;
  description?: string | null;
  color?: EnvironmentColor;
  isActive?: boolean;
}

export function useUpdateEnvironment(): UseMutationResult<EnvironmentSummary, Error, UpdateEnvironmentInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      apiRequest<EnvironmentSummary>(`/api/environments/${id}`, { method: 'PUT', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['environments'] });
    },
  });
}
