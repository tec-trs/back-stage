import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client.js';

export interface Url {
  id: string;
  label: string;
  url: string;
  urlType: string;
  description: string | null;
  method: string | null;
  authRequired: boolean;
  authMethod: string | null;
  status: string;
  healthcheckEnabled: boolean;
  lastCheckStatus: string | null;
  lastCheckedAt: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UrlsResponse {
  items: Url[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface UrlFilters {
  status?: string;
  urlType?: string;
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useUrls(filters: UrlFilters = {}) {
  return useQuery({
    queryKey: ['urls', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.urlType) params.append('urlType', filters.urlType);
      if (filters.tags?.length) params.append('tags', filters.tags.join(','));
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.pageSize) params.append('pageSize', String(filters.pageSize));

      return apiRequest<UrlsResponse>(`/api/urls?${params}`, { method: 'GET' });
    },
  });
}

export function useUrl(id: string) {
  return useQuery({
    queryKey: ['urls', id],
    queryFn: () => apiRequest<Url>(`/api/urls/${id}`, { method: 'GET' }),
    enabled: !!id,
  });
}

export function useCreateUrl() {
  return async (data: any) => {
    return apiRequest<Url>('/api/urls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };
}

export function useUpdateUrl() {
  return async (id: string, data: any) => {
    return apiRequest<Url>(`/api/urls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  };
}

export function useDeleteUrl() {
  return async (id: string) => {
    return apiRequest<void>(`/api/urls/${id}`, { method: 'DELETE' });
  };
}
