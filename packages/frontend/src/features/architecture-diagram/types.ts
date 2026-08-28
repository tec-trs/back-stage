import type { Node, Edge } from '@xyflow/react';

export type ResourceType = 'url' | 'application' | 'service' | 'database' | 'server';

export interface ResourceNode extends Node {
  type: ResourceType;
  data: {
    label: string;
    resourceType: ResourceType;
    description?: string;
  };
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
};

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  url: 'URL',
  application: 'Aplicação',
  service: 'Serviço',
  database: 'Banco de Dados',
  server: 'Servidor',
};
