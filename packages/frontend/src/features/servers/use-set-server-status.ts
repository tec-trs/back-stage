import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { ServerStatus, ServerSummary } from './use-servers';

export interface SetServerStatusInput {
  id: string;
  status: ServerStatus;
}

export function useSetServerStatus(): UseMutationResult<ServerSummary, Error, SetServerStatusInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: SetServerStatusInput) =>
      apiRequest<ServerSummary>(`/api/servers/${id}/status`, { method: 'PUT', body: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}
