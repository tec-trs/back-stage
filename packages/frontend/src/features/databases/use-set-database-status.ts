import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { Database } from './use-databases';

export type DatabaseStatus = 'active' | 'maintenance' | 'provisioning' | 'deactivated' | 'deprecated';

export interface SetDatabaseStatusInput {
  id: string;
  status: DatabaseStatus;
}

export function useSetDatabaseStatus(): UseMutationResult<Database, Error, SetDatabaseStatusInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: SetDatabaseStatusInput) =>
      apiRequest<Database>(`/api/databases/${id}/status`, { method: 'PUT', body: { status } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['databases'] });
    },
  });
}
