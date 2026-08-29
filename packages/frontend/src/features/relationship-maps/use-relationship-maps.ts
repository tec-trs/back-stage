import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiRequest } from '../../shared/api/http-client';

export type MapResourceType = 'server' | 'application' | 'database' | 'url' | 'vip';

export interface RelationshipMap {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdByUserId?: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipMapNode {
  id: string;
  resourceType: MapResourceType;
  label: string;
  status?: string;
}

export interface RelationshipMapEdge {
  id: string;
  relationshipId: string;
  sourceType: MapResourceType;
  sourceId: string;
  targetType: MapResourceType;
  targetId: string;
  relationType: string;
  reason?: string | null;
}

export interface RelationshipMapDetail extends RelationshipMap {
  nodes: RelationshipMapNode[];
  edges: RelationshipMapEdge[];
}

const MAPS_KEY = ['relationship-maps'] as const;

export function useRelationshipMaps() {
  return useQuery({
    queryKey: MAPS_KEY,
    queryFn: () =>
      apiRequest<{ items: RelationshipMap[] }>('/api/relationship-maps').then((r) => r.items),
  });
}

export function useRelationshipMap(mapId: string | null) {
  return useQuery({
    queryKey: [...MAPS_KEY, mapId],
    queryFn: () => apiRequest<RelationshipMapDetail>(`/api/relationship-maps/${mapId}`),
    enabled: !!mapId,
  });
}

export function useCreateRelationshipMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiRequest<RelationshipMap>('/api/relationship-maps', { method: 'POST', body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MAPS_KEY });
    },
  });
}

export function useUpdateRelationshipMap(mapId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      apiRequest<RelationshipMap>(`/api/relationship-maps/${mapId}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MAPS_KEY });
    },
  });
}

export function useDeleteRelationshipMap() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mapId: string) =>
      apiRequest<void>(`/api/relationship-maps/${mapId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MAPS_KEY });
    },
  });
}

export function useAttachRelationshipToMap(mapId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (relationshipId: string) =>
      apiRequest<RelationshipMapDetail>(`/api/relationship-maps/${mapId}/relationships`, {
        method: 'POST',
        body: { relationshipId },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MAPS_KEY });
    },
  });
}

export function useDetachRelationshipFromMap(mapId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (relationshipId: string) =>
      apiRequest<RelationshipMapDetail>(`/api/relationship-maps/${mapId}/relationships/${relationshipId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MAPS_KEY });
    },
  });
}
