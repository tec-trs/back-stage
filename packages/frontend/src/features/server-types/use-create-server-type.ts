import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { ServerTypeSummary } from './use-server-types';

export interface CreateServerTypeInput {
  slug: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export function useCreateServerType(): UseMutationResult<ServerTypeSummary, Error, CreateServerTypeInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => apiRequest<ServerTypeSummary>('/api/server-types', { method: 'POST', body: input }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['server-types'] }); },
  });
}
