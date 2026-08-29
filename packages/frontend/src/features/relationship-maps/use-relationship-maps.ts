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

export interface RelationshipMapNodeService {
  name: string;
  status: string;
}

export interface RelationshipMapNode {
  id: string;
  resourceType: MapResourceType;
  label: string;
  status?: string;
  // Lightweight services registered on a servidor (servers.services) — nested
  // visually inside the server's node, not an independently linkable resource.
  services?: RelationshipMapNodeService[];
}

export interface RelationshipMapEdge {
  // The membership row's own id — pass this (not relationshipId) to detach.
  id: string;
  // Id of the underlying resource_relationships row, when one exists.
  relationshipId: string | null;
  // True for a relationship type the CMDB derives elsewhere (e.g. "hosts"
  // servidor->aplicacao, "expoe" ->url) instead of storing its own row —
  // tagged into the map by natural key rather than by a real relationship id.
  isImplicit: boolean;
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

export interface ImplicitRelationshipKey {
  sourceType: MapResourceType;
  sourceId: string;
  targetType: MapResourceType;
  targetId: string;
  relationType: string;
}

export type AttachRelationshipInput = { relationshipId: string } | ImplicitRelationshipKey;

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
    mutationFn: (input: AttachRelationshipInput) =>
      apiRequest<RelationshipMapDetail>(`/api/relationship-maps/${mapId}/relationships`, {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MAPS_KEY });
    },
  });
}

export function useDetachRelationshipFromMap(mapId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    // memberId is the membership row's own id (RelationshipMapEdge.id), not the
    // underlying relationship id — required since an implicit member has no
    // underlying relationship id to key off of.
    mutationFn: (memberId: string) =>
      apiRequest<RelationshipMapDetail>(`/api/relationship-maps/${mapId}/relationships/${memberId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MAPS_KEY });
    },
  });
}
