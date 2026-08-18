import { useMutation, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import { useAuthStore, type AuthUser, type OrgOption } from './auth.store';

interface SelectOrgInput {
  pendingToken: string;
  organizationId: string;
}

interface SelectOrgResponse {
  status: 'ok';
  accessToken: string;
  user: AuthUser;
  organizationId: string;
  organizationName: string;
}

export function useSelectOrg(
  organizations: OrgOption[],
): UseMutationResult<SelectOrgResponse, Error, SelectOrgInput> {
  const setSession = useAuthStore((state) => state.setSession);
  const setOrganizations = useAuthStore((state) => state.setOrganizations);

  return useMutation({
    mutationFn: (input: SelectOrgInput) =>
      apiRequest<SelectOrgResponse>('/api/auth/select-org', { method: 'POST', body: input }),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user, data.organizationId, data.organizationName);
      setOrganizations(organizations);
    },
  });
}
