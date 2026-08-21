import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

import type { Url } from './use-urls';

export type UrlHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface CreateUrlInput {
  label: string;
  url: string;
  urlType: string;
  description?: string | null;
  method?: UrlHttpMethod | null;
  authRequired?: boolean;
  authMethod?: string | null;
  status?: string;
  healthcheckEnabled?: boolean;
  tags?: string[];
}

export function useCreateUrl(): UseMutationResult<Url, Error, CreateUrlInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUrlInput) =>
      apiRequest<Url>('/api/urls', { method: 'POST', body: input }),
    onSuccess: async () => {
      await queryClient.refetchQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return key === 'urls' || key === 'resource-graph' || key === 'resource-graph-subgraph';
      }});
    },
  });
}
