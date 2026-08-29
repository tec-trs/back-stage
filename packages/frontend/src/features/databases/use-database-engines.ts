import { useMutation, useQuery, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client';

export interface DatabaseEngine {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  defaultPort: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDatabaseEngineInput {
  slug: string;
  name: string;
  description?: string | null;
  defaultPort?: number | null;
  isActive?: boolean;
}

export interface UpdateDatabaseEngineInput {
  name?: string;
  description?: string | null;
  defaultPort?: number | null;
  isActive?: boolean;
}

export function useDatabaseEngines() {
  return useQuery({
    queryKey: ['database-engines'],
    queryFn: () =>
      apiRequest<{ items: DatabaseEngine[] }>('/api/database-engines/engines', { method: 'GET' }).then(
        (r) => r.items,
      ),
  });
}

export function useActiveDatabaseEngines() {
  return useQuery({
    queryKey: ['database-engines-active'],
    queryFn: () =>
      apiRequest<{ items: DatabaseEngine[] }>('/api/database-engines/engines/active', { method: 'GET' }).then(
        (r) => r.items,
      ),
  });
}

export function useCreateDatabaseEngine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDatabaseEngineInput) =>
      apiRequest<DatabaseEngine>('/api/database-engines/engines', {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['database-engines'] });
      void queryClient.invalidateQueries({ queryKey: ['database-engines-active'] });
    },
  });
}

export function useUpdateDatabaseEngine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateDatabaseEngineInput & { id: string }) =>
      apiRequest<DatabaseEngine>(`/api/database-engines/engines/${id}`, {
        method: 'PUT',
        body,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['database-engines'] });
      void queryClient.invalidateQueries({ queryKey: ['database-engines-active'] });
    },
  });
}

export function useDeleteDatabaseEngine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<void>(`/api/database-engines/engines/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['database-engines'] });
      void queryClient.invalidateQueries({ queryKey: ['database-engines-active'] });
    },
  });
}

// There's no bulk-delete route on the backend for this small lookup table (unlike
// server-types' dedicated /bulk-delete endpoint) — deleting one row at a time is
// cheap enough here, so this just fires the existing single-delete call per id and
// invalidates the list once everything settles, giving the same "Eliminar (N)"
// toolbar experience as the servers/server-types pages without adding a new route.
export function useBulkDeleteDatabaseEngines(): UseMutationResult<{ deleted: number }, Error, string[]> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id) =>
          apiRequest<void>(`/api/database-engines/engines/${id}`, {
            method: 'DELETE',
          }),
        ),
      );
      return { deleted: ids.length };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['database-engines'] });
      void queryClient.invalidateQueries({ queryKey: ['database-engines-active'] });
    },
  });
}
