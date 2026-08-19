import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export function useBulkDeleteDatabases(): UseMutationResult<{ deleted: number }, Error, string[]> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) =>
      apiRequest<{ deleted: number }>('/api/databases/bulk-delete', {
        method: 'POST',
        body: { ids },
      }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return key === 'databases' || key === 'resource-graph' || key === 'resource-graph-subgraph';
      }});
    },
  });
}
