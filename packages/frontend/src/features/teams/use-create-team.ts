import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { TeamSummary } from './use-teams';

export interface CreateTeamInput {
  name: string;
  slug: string;
  description?: string | null;
}

export function useCreateTeam(): UseMutationResult<TeamSummary, Error, CreateTeamInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input) => apiRequest<TeamSummary>('/api/teams', { method: 'POST', body: input }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['teams'] }); },
  });
}
