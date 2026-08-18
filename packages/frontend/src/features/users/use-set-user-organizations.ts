import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { UserOrgEntry } from './use-user-organizations';

interface SetOrgsInput {
  userId: string;
  organizations: UserOrgEntry[];
}

export function useSetUserOrganizations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, organizations }: SetOrgsInput) =>
      apiRequest<void>(`/api/users/${userId}/organizations`, {
        method: 'PUT',
        body: { organizations },
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['user-organizations', variables.userId] });
    },
  });
}
