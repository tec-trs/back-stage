import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export type TeamRole = 'owner' | 'member';

export interface TeamMember {
  userId: string;
  fullName: string;
  email: string;
  code: string;
  isActive: boolean;
  role: TeamRole;
}

export interface TeamSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  memberCount: number;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export function useTeams(): UseQueryResult<TeamSummary[]> {
  return useQuery({
    queryKey: ['teams'],
    queryFn: () =>
      apiRequest<{ items: TeamSummary[] }>('/api/teams').then((r) => r.items),
    staleTime: 1000 * 60 * 2,
  });
}
