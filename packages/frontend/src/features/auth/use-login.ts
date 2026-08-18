import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import { useAuthStore, type AuthUser, type OrgOption } from './auth.store';

interface LoginInput {
  code: string;
  password: string;
}

interface LoginOkResponse {
  status: 'ok';
  accessToken: string;
  user: AuthUser;
  organizationId: string;
  organizationName: string;
}

interface LoginSelectOrgResponse {
  status: 'select_org';
  pendingToken: string;
  organizations: OrgOption[];
}

export type LoginResponse = LoginOkResponse | LoginSelectOrgResponse;

export function useLogin(): UseMutationResult<LoginResponse, Error, LoginInput> {
  const setSession = useAuthStore((state) => state.setSession);
  const setOrganizations = useAuthStore((state) => state.setOrganizations);

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiRequest<LoginResponse>('/api/auth/login', { method: 'POST', body: input }),
    onSuccess: (data) => {
      if (data.status === 'ok') {
        setSession(data.accessToken, data.user, data.organizationId, data.organizationName);
      }
    },
    onError: () => {
      // clear any stale org list on error
      setOrganizations([]);
    },
  });
}
