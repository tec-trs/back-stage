export type ResourceType = 'server' | 'application' | 'database' | 'url';

export type RelationType = 'hosts' | 'depends_on' | 'connects_to' | 'exposes' | 'consumes' | 'part_of';

export interface ResourceRef {
  type: ResourceType;
  id: string;
  label: string;
  status?: string;
  criticality?: string;
}

export interface GraphNode {
  id: string;
  resourceType: ResourceType;
  label: string;
  status?: string;
  criticality?: string;
  environment?: string;
  hostedOnServerId?: string | null;
  monitoringUrl?: string | null;
}

export interface GraphEdge {
  id: string;
  sourceType: ResourceType;
  sourceId: string;
  targetType: ResourceType;
  targetId: string;
  relationType: RelationType;
  metadata?: Record<string, unknown>;
}

export interface ImpactNode {
  resourceType: ResourceType;
  resourceId: string;
  depth: number;
  label: string;
  status?: string;
  criticality?: string;
}

export interface ImpactResult {
  impactedResources: ImpactNode[];
  hasCycle: boolean;
  totalImpacted: number;
  byType: Record<ResourceType, number>;
  byDepth: Record<number, ImpactNode[]>;
}

export interface GraphFilters {
  resourceTypes?: ResourceType[];
  environment?: string;
  criticality?: string;
  status?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}
