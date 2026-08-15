import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { TeamSummary } from './use-teams';

export interface UpdateTeamInput {
  id: string;
  name?: string;
  description?: string | null;
}

export function useUpdateTeam(): UseMutationResult<TeamSummary, Error, UpdateTeamInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) =>
      apiRequest<TeamSummary>(`/api/teams/${id}`, { method: 'PUT', body }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['teams'] }); },
  });
}
