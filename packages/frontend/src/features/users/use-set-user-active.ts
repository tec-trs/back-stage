import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { UserSummary } from './use-users';

export interface SetUserActiveInput {
  id: string;
  isActive: boolean;
}

export function useSetUserActive(): UseMutationResult<UserSummary, Error, SetUserActiveInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: SetUserActiveInput) =>
      apiRequest<UserSummary>(`/api/users/${id}/${isActive ? 'activate' : 'deactivate'}`, {
        method: 'PUT',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
