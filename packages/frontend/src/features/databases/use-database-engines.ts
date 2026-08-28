import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
