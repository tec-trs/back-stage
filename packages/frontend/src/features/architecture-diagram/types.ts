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

export const RESOURCE_COLORS: Record<ResourceType, string> = {
  url: '#fbbf24',
  application: '#a78bfa',
  service: '#60a5fa',
  database: '#f472b6',
  server: '#34d399',
};

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  url: '🌐 URL',
  application: '📱 Aplicação',
  service: '⚙️ Serviço',
  database: '🗄️ Banco de Dados',
  server: '🖥️ Servidor',
};
