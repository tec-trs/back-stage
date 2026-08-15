import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export function useDeleteApplicationType(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiRequest<void>(`/api/application-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['application-types'] }); },
  });
}
