import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SwitchOrgInput) =>
      apiRequest<SwitchOrgResponse>('/api/auth/switch-org', { method: 'POST', body: input }),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user, data.organizationId, data.organizationName);
      // Every cached query (environments, teams, servers, applications, ...)
      // was fetched under the PREVIOUS organization's JWT. None of their
      // query keys carry an organization id, and several (environments,
      // teams) have a multi-minute staleTime, so without this the UI kept
      // showing the old org's data after switching — looking like those
      // cadastros were shared across organizations, and the reverse case
      // (switching into a brand new, genuinely empty org) looked like data
      // had vanished. Clearing the cache forces every mounted query to
      // refetch under the newly active organization.
      void queryClient.clear();
    },
  });
}
