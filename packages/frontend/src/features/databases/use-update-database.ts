import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { CreateDatabaseInput } from './use-create-database';
import type { Database } from './use-databases';

export interface UpdateDatabaseInput extends Partial<CreateDatabaseInput> {
  id: string;
}

export function useUpdateDatabase(): UseMutationResult<Database, Error, UpdateDatabaseInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateDatabaseInput) =>
      apiRequest<Database>(`/api/databases/${id}`, { method: 'PUT', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['databases'] });
    },
  });
}
