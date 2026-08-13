import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import { useAuthStore, type AuthUser } from './auth.store';

interface LoginInput {
  code: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function useLogin(): UseMutationResult<LoginResponse, Error, LoginInput> {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: input }),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
    },
  });
}
