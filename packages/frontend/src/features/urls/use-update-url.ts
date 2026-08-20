import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import { urlQueryPredicate } from '../../shared/api/query-helpers';

import type { CreateUrlInput } from './use-create-url';
import type { Url } from './use-urls';

export interface UpdateUrlInput extends Partial<CreateUrlInput> {
  id: string;
}

export function useUpdateUrl(): UseMutationResult<Url, Error, UpdateUrlInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: UpdateUrlInput) =>
      apiRequest<Url>(`/api/urls/${id}`, { method: 'PUT', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ predicate: urlQueryPredicate });
    },
  });
}
