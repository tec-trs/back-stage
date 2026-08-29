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
  // The membership row's own id — a stable handle for detaching, valid for both
  // explicit and implicit members.
  id: string;
  // The underlying resource_relationships row id, when one exists. Null for an
  // implicit relationship (see isImplicit).
  relationshipId: string | null;
  // True for a relationship type the CMDB models elsewhere instead of storing as
  // its own resource_relationships row — "hosts" between servidor and aplicacao
  // (application_deployments), or "expoe" targeting a url (urls.owner_resource_id).
  // These are tagged into the map by their natural key rather than by a real id.
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

export interface CreateRelationshipMapDto {
  name: string;
  description?: string;
}

export interface UpdateRelationshipMapDto {
  name?: string;
  description?: string;
}

export interface ImplicitRelationshipKey {
  sourceType: MapResourceType;
  sourceId: string;
  targetType: MapResourceType;
  targetId: string;
  relationType: string;
}

export type AttachRelationshipInput = { relationshipId: string } | ImplicitRelationshipKey;
