import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../shared/api/http-client';

export interface ArchitectureDiagramNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    resourceType: string;
    description?: string;
    resourceId?: string;
  };
}

export interface ArchitectureDiagramEdge {
  id: string;
  source: string;
  target: string;
}

export interface ArchitectureDiagram {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  nodes: ArchitectureDiagramNode[];
  edges: ArchitectureDiagramEdge[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export function useArchitectureDiagrams() {
  return useQuery<ArchitectureDiagram[]>({
    queryKey: ['architecture-diagrams'],
    queryFn: () => apiRequest<ArchitectureDiagram[]>('/api/architecture-diagrams'),
  });
}

export function useArchitectureDiagram(id: string) {
  return useQuery<ArchitectureDiagram>({
    queryKey: ['architecture-diagrams', id],
    queryFn: () => apiRequest<ArchitectureDiagram>(`/api/architecture-diagrams/${id}`),
    enabled: !!id,
  });
}

export function useCreateArchitectureDiagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      name: string;
      description?: string;
      nodes: ArchitectureDiagramNode[];
      edges: ArchitectureDiagramEdge[];
    }) =>
      apiRequest<ArchitectureDiagram>('/api/architecture-diagrams', {
        method: 'POST',
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architecture-diagrams'] });
    },
  });
}

export function useUpdateArchitectureDiagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      description?: string;
      nodes?: ArchitectureDiagramNode[];
      edges?: ArchitectureDiagramEdge[];
    }) =>
      apiRequest<ArchitectureDiagram>(`/api/architecture-diagrams/${id}`, {
        method: 'PUT',
        body: input,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['architecture-diagrams'] });
      queryClient.invalidateQueries({ queryKey: ['architecture-diagrams', variables.id] });
    },
  });
}

export function useDeleteArchitectureDiagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/architecture-diagrams/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['architecture-diagrams'] });
    },
  });
}
