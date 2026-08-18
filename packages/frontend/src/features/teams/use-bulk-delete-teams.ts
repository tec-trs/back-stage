import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export function useBulkDeleteTeams(): UseMutationResult<{ deleted: number }, Error, string[]> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      apiRequest<{ deleted: number }>('/api/teams/bulk-delete', {
        method: 'POST',
        body: { ids },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
}
