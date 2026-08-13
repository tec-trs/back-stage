import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { ApplicationStatus, ApplicationSummary } from './use-applications';

export interface SetApplicationStatusInput {
  id: string;
  status: ApplicationStatus;
}

export function useSetApplicationStatus(): UseMutationResult<
  ApplicationSummary,
  Error,
  SetApplicationStatusInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: SetApplicationStatusInput) =>
      apiRequest<ApplicationSummary>(`/api/applications/${id}/status`, {
        method: 'PUT',
        body: { status },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}
