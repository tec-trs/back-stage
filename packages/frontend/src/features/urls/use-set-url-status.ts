import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { Url } from './use-urls';

export type UrlStatus = 'active' | 'inactive' | 'deprecated' | 'error';

export interface SetUrlStatusInput {
  id: string;
  status: UrlStatus;
}

export function useSetUrlStatus(): UseMutationResult<Url, Error, SetUrlStatusInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: SetUrlStatusInput) =>
      apiRequest<Url>(`/api/urls/${id}/status`, { method: 'PUT', body: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['urls'] });
    },
  });
}
