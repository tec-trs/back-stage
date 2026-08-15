import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';
import type { UserSummary } from './use-users';

interface ListUsersResponse {
  items: UserSummary[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useAllUsers(): UseQueryResult<UserSummary[]> {
  return useQuery({
    queryKey: ['users', 'all'],
    queryFn: () =>
      apiRequest<ListUsersResponse>('/api/users', { query: { page: 1, pageSize: 500 } }).then(
        (r) => r.items,
      ),
    staleTime: 1000 * 60 * 5,
  });
}
