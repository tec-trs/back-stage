import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { UserRole, UserSummary } from './use-users';

export interface CreateUserInput {
  code: string;
  email: string;
  fullName: string;
  password: string;
  roles: UserRole[];
}

export function useCreateUser(): UseMutationResult<UserSummary, Error, CreateUserInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      apiRequest<UserSummary>('/api/users', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
