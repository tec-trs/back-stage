import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client';

export interface ServerGroup {
  id: string;
  name: string;
  description?: string;
  environment?: string;
  status: 'active' | 'maintenance' | 'inactive';
  criticality?: string;
  vipHostname?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServerGroupInput {
  name: string;
  description?: string;
  environment?: string;
  status?: string;
  criticality?: string;
  vipHostname?: string;
  vipAddress?: string;
  loadBalancerType?: string;
  healthCheckInterval?: number;
  healthCheckPath?: string;
}

export interface UpdateServerGroupInput extends Partial<CreateServerGroupInput> {}

export interface GroupMember {
  id: string;
  serverId: string;
  groupId: string;
  order: number;
}

// Listar todos os grupos
export function useServerGroups() {
  return useQuery({
    queryKey: ['server-groups'],
    queryFn: async () => {
      const result = await apiRequest<{ items: ServerGroup[] }>('/api/server-groups');
      return result.items;
    },
  });
}

// Buscar um grupo específico
export function useServerGroup(groupId: string | null) {
  return useQuery({
    queryKey: ['server-groups', groupId],
    queryFn: async () => {
      if (!groupId) return null;
      return apiRequest<ServerGroup>(`/api/server-groups/${groupId}`);
    },
    enabled: !!groupId,
  });
}

// Criar novo grupo
export function useCreateServerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServerGroupInput) => {
      return apiRequest<ServerGroup>('/api/server-groups', {
        method: 'POST',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-groups'] });
    },
  });
}

// Atualizar grupo
export function useUpdateServerGroup(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateServerGroupInput) => {
      return apiRequest<ServerGroup>(`/api/server-groups/${groupId}`, {
        method: 'PUT',
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-groups'] });
      queryClient.invalidateQueries({ queryKey: ['server-groups', groupId] });
    },
  });
}

// Deletar grupo
export function useDeleteServerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string) => {
      return apiRequest(`/api/server-groups/${groupId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-groups'] });
    },
  });
}

// Listar membros de um grupo
export function useGroupMembers(groupId: string | null) {
  return useQuery({
    queryKey: ['server-groups', groupId, 'members'],
    queryFn: async () => {
      if (!groupId) return [];
      const result = await apiRequest<{ items: any[] }>(`/api/server-groups/${groupId}/members`);
      return result.items;
    },
    enabled: !!groupId,
  });
}

// Adicionar servidor ao grupo
export function useAddGroupMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      return apiRequest<ServerGroup>(`/api/server-groups/${groupId}/members`, {
        method: 'POST',
        body: { serverId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-groups', groupId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['server-groups', groupId] });
    },
  });
}

// Remover servidor do grupo
export function useRemoveGroupMember(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      return apiRequest(`/api/server-groups/${groupId}/members/${serverId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['server-groups', groupId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['server-groups', groupId] });
    },
  });
}
