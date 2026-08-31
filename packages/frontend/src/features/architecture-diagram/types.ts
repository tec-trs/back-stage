import type { Node, Edge } from '@xyflow/react';

export type ResourceType = 'url' | 'application' | 'service' | 'database' | 'server' | 'vip';

export interface ResourceNode extends Node {
  type: ResourceType;
  data: {
    label: string;
    resourceType: ResourceType;
    description?: string;
    // Set when this node was added from the inventory (via ToolBarSimple's resource
    // picker) rather than hand-typed. Only nodes with a resourceId point at a real
    // catalog entity, which is what lets a connection between two such nodes become
    // a real resource_relationships row instead of a purely visual line — see
    // isRelationshipCapableResourceType in features/resource-graph/relationship-types.
    resourceId?: string;
  };
}

// Data carried on an Edge when it represents a real resource_relationships row
// (created via useCreateRelationship / removed via useDeleteRelationship), rather
// than a purely visual connection. Kept on Edge.data so it round-trips through
// diagram save/load (nodes/edges are stored as opaque JSON on the backend).
export interface RelationshipEdgeData {
  relationshipId: string;
  relationType: string;
  reason?: string;
  [key: string]: unknown;
}

export interface Diagram {
  id: string;
  name: string;
  nodes: ResourceNode[];
  edges: Edge[];
  createdAt: Date;
  updatedAt: Date;
}

// Same resource palette used across the app (see tailwind.config.ts `resource.*`
// tokens) — kept as raw hex here too since these values also drive inline
// xyflow node/minimap styling, which can't consume Tailwind classes directly.
// 'service' reuses the vip/network hue since it plays the same "generic
// network service" role in a hand-drawn architecture diagram.
export const RESOURCE_COLORS: Record<ResourceType, string> = {
  server: '#3b82f6',
  application: '#8b5cf6',
  database: '#ec4899',
  url: '#f59e0b',
  service: '#06b6d4',
  // Same cyan the Ecosystem graph uses for VIPs (TYPE_STYLE.vip in ResourceGraph.tsx)
  vip: '#06b6d4',
};

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  url: 'URL',
  application: 'Aplicação',
  service: 'Serviço',
  database: 'Banco de Dados',
  server: 'Servidor',
  vip: 'VIP',
};
