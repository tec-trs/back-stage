import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client.js';

export interface Database {
  id: string;
  name: string;
  displayName: string | null;
  description: string | null;
  engine: string;
  version: string | null;
  port: number | null;
  hostedOnServerId: string | null;
  hostedOnServerHostname: string | null;
  connectionHost: string | null;
  connectionStringTemplate: string | null;
  isManagedService: boolean;
  dataClassification: string | null;
  criticality: string;
  ownerTeam: string | null;
  ownerUserId: string | null;
  costCenter: string | null;
  storageGb: number | null;
  replicationMode: string | null;
  hasBackup: boolean;
  backupPolicy: string | null;
  lastBackupAt: string | null;
  status: string;
  environment: string;
  monitoringUrl: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DatabasesResponse {
  items: Database[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface DatabaseFilters {
  status?: string;
  criticality?: string;
  engine?: string;
  environment?: string;
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useDatabases(filters: DatabaseFilters = {}) {
  return useQuery({
    queryKey: ['databases', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.criticality) params.append('criticality', filters.criticality);
      if (filters.engine) params.append('engine', filters.engine);
      if (filters.environment) params.append('environment', filters.environment);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

      return apiRequest<DatabasesResponse>(`/api/databases?${params}`, { method: 'GET' });
    },
  });
}

export function useDatabase(id: string) {
  return useQuery({
    queryKey: ['databases', id],
    queryFn: () => apiRequest<Database>(`/api/databases/${id}`, { method: 'GET' }),
    enabled: !!id,
  });
}

export function useCreateDatabase() {
  return async (data: any) => {
    return apiRequest<Database>('/api/databases', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };
}

export function useUpdateDatabase() {
  return async (id: string, data: any) => {
    return apiRequest<Database>(`/api/databases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };
}

export function useDeleteDatabase() {
  return async (id: string) => {
    return apiRequest<void>(`/api/databases/${id}`, { method: 'DELETE' });
  };
}

export function useAllDatabases() {
  return useQuery({
    queryKey: ['databases-all'],
    queryFn: async () => {
      let allItems: Database[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiRequest<DatabasesResponse>('/api/databases', {
          query: { page, pageSize: 100 },
        });
        allItems = allItems.concat(response.items);
        hasMore = response.pagination.page * response.pagination.pageSize < response.pagination.total;
        page++;
      }

      return allItems;
    },
  });
}
