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

interface ListAuditLogsResponse {
  items: AuditLogEntry[];
  pagination: { page: number; pageSize: number; total: number };
}

export function useAuditLogs(): UseQueryResult<ListAuditLogsResponse, Error> {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => apiRequest<ListAuditLogsResponse>('/api/audit-logs'),
  });
}
