import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface DatabaseGroup {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdByUserId?: string | null;
  memberCount: number;
  applicationCount: number;
  // Only populated by useDatabaseGroups() (the list endpoint) — every member
  // banco's id, so a caller can match a computed cluster of bancos against a
  // curated grupo without fetching each grupo's full detail.
  databaseIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseGroupMember {
  // The membership row's own id — pass this (not databaseId) to remove.
  id: string;
  databaseId: string;
  name: string;
  displayName?: string | null;
  status?: string;
  criticality?: string;
  hostedOnServerId?: string | null;
  hostedOnServerLabel?: string | null;
}

export interface DatabaseGroupApplicationLink {
  // The link row's own id — pass this (not applicationId) to remove.
  id: string;
  applicationId: string;
  displayName?: string | null;
  status?: string;
}

export interface DatabaseGroupDetail extends DatabaseGroup {
  members: DatabaseGroupMember[];
  applications: DatabaseGroupApplicationLink[];
}

const GROUPS_KEY = ['database-groups'] as const;

export function useDatabaseGroups() {
  return useQuery({
    queryKey: GROUPS_KEY,
    queryFn: () =>
      apiRequest<{ items: DatabaseGroup[] }>('/api/database-groups').then((r) => r.items),
  });
}

export function useDatabaseGroup(groupId: string | null) {
  return useQuery({
    queryKey: [...GROUPS_KEY, groupId],
    queryFn: () => apiRequest<DatabaseGroupDetail>(`/api/database-groups/${groupId}`),
    enabled: !!groupId,
  });
}

export function useCreateDatabaseGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiRequest<DatabaseGroup>('/api/database-groups', { method: 'POST', body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useUpdateDatabaseGroup(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      apiRequest<DatabaseGroup>(`/api/database-groups/${groupId}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useDeleteDatabaseGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) =>
      apiRequest<void>(`/api/database-groups/${groupId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useAddDatabaseGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (databaseId: string) =>
      apiRequest<DatabaseGroupDetail>(`/api/database-groups/${groupId}/members`, {
        method: 'POST',
        body: { databaseId },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useRemoveDatabaseGroupMember(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // memberId is the membership row's own id (DatabaseGroupMember.id), not
    // the database id.
    mutationFn: (memberId: string) =>
      apiRequest<DatabaseGroupDetail>(`/api/database-groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useAddDatabaseGroupApplication(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationId: string) =>
      apiRequest<DatabaseGroupDetail>(`/api/database-groups/${groupId}/applications`, {
        method: 'POST',
        body: { applicationId },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}

export function useRemoveDatabaseGroupApplication(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // linkId is the link row's own id (DatabaseGroupApplicationLink.id), not
    // the application id.
    mutationFn: (linkId: string) =>
      apiRequest<DatabaseGroupDetail>(`/api/database-groups/${groupId}/applications/${linkId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GROUPS_KEY });
    },
  });
}
