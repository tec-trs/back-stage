export type MapResourceType = 'server' | 'application' | 'database' | 'url' | 'vip';

export interface RelationshipMap {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  createdByUserId?: string | null;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
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

export interface CreateRelationshipMapDto {
  name: string;
  description?: string;
}

export interface UpdateRelationshipMapDto {
  name?: string;
  description?: string;
}
