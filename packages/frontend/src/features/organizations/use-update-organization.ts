import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { OrganizationSummary } from './use-organizations';

interface UpdateInput {
  id: string;
  name?: string;
  plan?: string;
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateInput) =>
      apiRequest<OrganizationSummary>(`/api/organizations/${id}`, { method: 'PUT', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
