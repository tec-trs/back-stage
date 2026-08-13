import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { UserRole, UserSummary } from './use-users';

export interface UpdateUserInput {
  id: string;
  email?: string;
  fullName?: string;
  roles?: UserRole[];
}

export function useUpdateUser(): UseMutationResult<UserSummary, Error, UpdateUserInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUserInput) =>
      apiRequest<UserSummary>(`/api/users/${id}`, { method: 'PUT', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
