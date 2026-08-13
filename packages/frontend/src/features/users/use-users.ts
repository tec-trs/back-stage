import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export type UserRole = 'admin' | 'maintainer' | 'viewer';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  isActive: boolean;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

interface ListUsersResponse {
  items: UserSummary[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useUsers(page = 1): UseQueryResult<ListUsersResponse, Error> {
  return useQuery({
    queryKey: ['users', page],
    queryFn: () => apiRequest<ListUsersResponse>('/api/users', { query: { page, pageSize: 20 } }),
  });
}
