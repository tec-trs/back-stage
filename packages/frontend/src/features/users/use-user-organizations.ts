import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface UserOrgEntry {
  organizationId: string;
  role: string;
}

export function useUserOrganizations(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-organizations', userId],
    queryFn: () =>
      apiRequest<{ items: UserOrgEntry[] }>(`/api/users/${userId}/organizations`).then(
        (d) => d.items,
      ),
    enabled: Boolean(userId),
  });
}
