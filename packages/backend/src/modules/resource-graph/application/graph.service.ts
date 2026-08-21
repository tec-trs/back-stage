import { NotFoundError, ValidationError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type {
  CriticalResource,
  GraphEdge,
  GraphFilters,
  GraphNode,
  ImpactResult,
  Pagination,
  RelationType,
  ResourceType,
} from '../domain/graph.types.js';
import { ResourceRelationshipRepository } from '../infrastructure/resource-relationship.repository.js';

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface GetFullGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface GetSubgraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export class GraphService {
  public constructor(private readonly repository: ResourceRelationshipRepository) {}

  public async getFullGraph(filters: GraphFilters, pagination: Pagination): Promise<GetFullGraphResult> {
    const { nodes, edges, total } = await this.repository.getFullGraph(filters, pagination);

    if (total > 500 && nodes.length === 0) {
      throw new ValidationError(
        'Grafo muito grande. Aplique filtros para reduzir o tamanho (ex: environment, criticality ou resourceTypes)',
      );
    }

    return {
      nodes,
      edges,
      pagination: { ...pagination, total },
    };
  }

  public async getSubgraph(
    resourceType: ResourceType,
    resourceId: string,
    options: { depth?: number; direction?: 'upstream' | 'downstream' | 'both'; relationType?: string } = {},
  ): Promise<GetSubgraphResult> {
    return this.repository.getSubgraph(resourceType, resourceId, options);
  }

  public async listRelationships(filters: {
    sourceType?: ResourceType;
    sourceId?: string;
    targetType?: ResourceType;
    targetId?: string;
    relationType?: string;
  }): Promise<GraphEdge[]> {
    return this.repository.listRelationships(filters);
  }

  public async simulateImpact(
    resourceType: ResourceType,
    resourceId: string,
    maxDepth?: number,
  ): Promise<ImpactResult> {
    return this.repository.getTransitiveImpact(resourceType, resourceId, maxDepth);
  }

  public async createRelationship(
    sourceType: ResourceType,
    sourceId: string,
    targetType: ResourceType,
    targetId: string,
    relationType: RelationType,
    metadata: Record<string, unknown> | undefined,
    audit: AuditContext,
    reason?: string,
  ): Promise<GraphEdge> {
    if (sourceType === targetType && sourceId === targetId) {
      throw new ValidationError('Um recurso nao pode ter relacao consigo mesmo');
    }

    const edge = await this.repository.createRelationship(
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationType,
      metadata,
      reason,
      audit.actorUserId ?? undefined,
    );

    // Implicit edges have non-UUID IDs (e.g. "deploy:...") — store null so the
    // uuid column doesn't reject the insert; source/target are in metadata.
    const UUID_RE = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;
    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'relationship.created',
      resourceType: 'relationship',
      resourceId: UUID_RE.test(edge.id) ? edge.id : null,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: {
        sourceType,
        sourceId,
        targetType,
        targetId,
        relationType,
      },
    });

    return edge;
  }

  public async deleteRelationship(edgeId: string, audit: AuditContext): Promise<void> {
    const deleted = await this.repository.deleteRelationship(edgeId);
    if (!deleted) {
      throw new NotFoundError('Relacionamento', edgeId);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'relationship.deleted',
      resourceType: 'relationship',
      resourceId: edgeId,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  }

  public async getCriticalResources(): Promise<CriticalResource[]> {
    return this.repository.getCriticalResources();
  }
}
