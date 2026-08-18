import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import { type AuthUser } from './auth.store';
import { useAuthStore } from './auth.store';

interface SwitchOrgInput {
  organizationId: string;
}

interface SwitchOrgResponse {
  status: 'ok';
  accessToken: string;
  user: AuthUser;
  organizationId: string;
  organizationName: string;
}

export function useSwitchOrg(): UseMutationResult<SwitchOrgResponse, Error, SwitchOrgInput> {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: SwitchOrgInput) =>
      apiRequest<SwitchOrgResponse>('/api/auth/switch-org', { method: 'POST', body: input }),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user, data.organizationId, data.organizationName);
    },
  });
}
