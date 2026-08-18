import { useQuery } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface OrganizationSummary {
  id: string;
  slug: string;
  name: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
}

async function fetchOrganizations(): Promise<OrganizationSummary[]> {
  const data = await apiRequest<{ items: OrganizationSummary[] }>('/api/organizations');
  return data.items;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  });
}
