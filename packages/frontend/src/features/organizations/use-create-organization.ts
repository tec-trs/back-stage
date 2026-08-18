import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { OrganizationSummary } from './use-organizations';

interface CreateInput {
  slug: string;
  name: string;
  plan?: string;
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateInput) =>
      apiRequest<OrganizationSummary>('/api/organizations', { method: 'POST', body: input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
