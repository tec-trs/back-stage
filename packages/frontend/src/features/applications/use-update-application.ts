import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { ApplicationSummary } from './use-applications';
import type { CreateApplicationInput } from './use-create-application';

export interface UpdateApplicationInput extends Partial<CreateApplicationInput> {
  id: string;
}

export function useUpdateApplication(): UseMutationResult<
  ApplicationSummary,
  Error,
  UpdateApplicationInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateApplicationInput) =>
      apiRequest<ApplicationSummary>(`/api/applications/${id}`, { method: 'PUT', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
