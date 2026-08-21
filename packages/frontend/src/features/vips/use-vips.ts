import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client';

export interface VIP {
  id: string;
  hostname: string;
  displayName?: string;
  description?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
  status: 'active' | 'maintenance' | 'inactive';
  environment?: string;
  criticality?: string;
  ownerTeam?: string;
  ownerUserId?: string;
  costCenter?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVIPInput {
  hostname: string;
  displayName?: string;
  description?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
  status?: string;
  environment?: string;
  criticality?: string;
  ownerTeam?: string;
  ownerUserId?: string;
  costCenter?: string;
}

export interface UpdateVIPInput extends Partial<CreateVIPInput> {}

// Listar todos os VIPs
export function useVIPs() {
  return useQuery({
    queryKey: ['vips'],
    queryFn: async () => {
      const result = await apiRequest<{ items: VIP[] }>('/api/vips');
      return result.items;
    },
  });
}

// Buscar um VIP específico
export function useVIP(vipId: string | null) {
  return useQuery({
    queryKey: ['vips', vipId],
    queryFn: async () => {
      if (!vipId) return null;
      return apiRequest<VIP>(`/api/vips/${vipId}`);
    },
    enabled: !!vipId,
  });
}

// Criar novo VIP
export function useCreateVIP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVIPInput) => {
      return apiRequest<VIP>('/api/vips', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vips'] });
    },
  });
}

// Atualizar VIP
export function useUpdateVIP(vipId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateVIPInput) => {
      return apiRequest<VIP>(`/api/vips/${vipId}`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vips'] });
      queryClient.invalidateQueries({ queryKey: ['vips', vipId] });
    },
  });
}

// Deletar VIP
export function useDeleteVIP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vipId: string) => {
      return apiRequest(`/api/vips/${vipId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vips'] });
    },
  });
}

// Listar servidores de um VIP
export function useVIPServers(vipId: string | null) {
  return useQuery({
    queryKey: ['vips', vipId, 'servers'],
    queryFn: async () => {
      if (!vipId) return [];
      const result = await apiRequest<{ items: any[] }>(`/api/vips/${vipId}/servers`);
      return result.items;
    },
    enabled: !!vipId,
  });
}

// Adicionar servidor ao VIP
export function useAddVIPServer(vipId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      return apiRequest<VIP>(`/api/vips/${vipId}/servers`, {
        method: 'POST',
        body: { serverId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vips', vipId, 'servers'] });
      queryClient.invalidateQueries({ queryKey: ['vips', vipId] });
    },
  });
}

// Remover servidor do VIP
export function useRemoveVIPServer(vipId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      return apiRequest(`/api/vips/${vipId}/servers/${serverId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vips', vipId, 'servers'] });
      queryClient.invalidateQueries({ queryKey: ['vips', vipId] });
    },
  });
}
