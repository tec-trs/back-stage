import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { TeamRole, TeamSummary } from './use-teams';

export interface AddMemberInput {
  teamId: string;
  userId: string;
  role?: TeamRole;
}

export interface RemoveMemberInput {
  teamId: string;
  userId: string;
}

export interface UpdateMemberRoleInput {
  teamId: string;
  userId: string;
  role: TeamRole;
}

export function useAddTeamMember(): UseMutationResult<TeamSummary, Error, AddMemberInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId, role }) =>
      apiRequest<TeamSummary>(`/api/teams/${teamId}/members`, {
        method: 'POST',
        body: { userId, role: role ?? 'member' },
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['teams'] }); },
  });
}

export function useRemoveTeamMember(): UseMutationResult<TeamSummary, Error, RemoveMemberInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId }) =>
      apiRequest<TeamSummary>(`/api/teams/${teamId}/members/${userId}`, { method: 'DELETE' }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['teams'] }); },
  });
}

export function useUpdateMemberRole(): UseMutationResult<TeamSummary, Error, UpdateMemberRoleInput> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, userId, role }) =>
      apiRequest<TeamSummary>(`/api/teams/${teamId}/members/${userId}`, {
        method: 'PATCH',
        body: { role },
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ['teams'] }); },
  });
}
