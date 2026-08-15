import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { ServerTypeSummary } from './use-server-types';

export interface UpdateServerTypeInput {
  id: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export function useUpdateServerType(): UseMutationResult<ServerTypeSummary, Error, UpdateServerTypeInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      apiRequest<ServerTypeSummary>(`/api/server-types/${id}`, { method: 'PUT', body }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['server-types'] }); },
  });
}
