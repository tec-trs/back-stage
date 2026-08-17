import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export interface AuditLogEntry {
  id: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
}

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  page?: number;
  pageSize?: number;
}

interface ListAuditLogsResponse {
  items: AuditLogEntry[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useAuditLogs(filters: AuditLogFilters = {}): UseQueryResult<ListAuditLogsResponse, Error> {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () =>
      apiRequest<ListAuditLogsResponse>('/api/audit-logs', {
        query: {
          ...(filters.action ? { action: filters.action } : {}),
          ...(filters.resourceType ? { resourceType: filters.resourceType } : {}),
          ...(filters.resourceId ? { resourceId: filters.resourceId } : {}),
          page: filters.page ?? 1,
          pageSize: filters.pageSize ?? 50,
        },
      }),
  });
}
