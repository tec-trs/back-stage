import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { CreateServerInput } from './use-create-server';
import type { ServerSummary } from './use-servers';

export interface UpdateServerInput extends Partial<CreateServerInput> {
  id: string;
}

export function useUpdateServer(): UseMutationResult<ServerSummary, Error, UpdateServerInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateServerInput) =>
      apiRequest<ServerSummary>(`/api/servers/${id}`, { method: 'PUT', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}
