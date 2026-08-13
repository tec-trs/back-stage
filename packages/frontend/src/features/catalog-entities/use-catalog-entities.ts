import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface CatalogEntitySummary {
  id: string;
  kind: string;
  type: string;
  name: string;
  namespace: string;
  title: string | null;
  description: string | null;
  lifecycle: string;
}

interface ListCatalogEntitiesResponse {
  items: CatalogEntitySummary[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useCatalogEntities(
  kind?: string,
): UseQueryResult<ListCatalogEntitiesResponse, Error> {
  return useQuery({
    queryKey: ['catalog-entities', kind],
    queryFn: () =>
      apiRequest<ListCatalogEntitiesResponse>('/api/catalog-entities', {
        query: { kind, pageSize: 50 },
      }),
  });
}
