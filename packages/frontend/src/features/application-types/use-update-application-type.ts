import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { ApplicationTypeSummary } from './use-application-types';

export interface UpdateApplicationTypeInput {
  id: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export function useUpdateApplicationType(): UseMutationResult<ApplicationTypeSummary, Error, UpdateApplicationTypeInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      apiRequest<ApplicationTypeSummary>(`/api/application-types/${id}`, { method: 'PUT', body }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['application-types'] }); },
  });
}
