import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export function useDeleteAuditLogs(): UseMutationResult<{ deleted: number }, Error, string[]> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      apiRequest<{ deleted: number }>('/api/audit-logs', { method: 'DELETE', body: { ids } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
    },
  });
}
