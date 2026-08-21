import type { Knex } from 'knex';
import type { GraphEdge } from '../domain/graph.types.js';

const TABLE_NAME = 'resource_relationships';

interface RelationshipRow {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation_type: string;
  metadata?: Record<string, unknown>;
  reason?: string | null;
  created_by_user_id?: string | null;
  created_by_name?: string | null;
  created_at?: string;
}

interface TraversalRow {
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation_type: string;
  depth: number;
}

/**
 * GraphRepository provides database-backed graph operations.
 * Focuses on edge queries and transitive closure computation.
 */
export class GraphRepository {
  public constructor(private readonly db: Knex) {}

  /**
   * Get all direct edges from a given source resource.
   * Filters out soft-deleted relationships (deleted_at IS NULL).
   */
  public async getEdgesBySourceId(sourceId: string, orgId: string): Promise<GraphEdge[]> {
    const rows = (await this.db(TABLE_NAME)
      .select('*')
      .where('source_id', sourceId)
      .where('organization_id', orgId)
      .whereNull('deleted_at')) as RelationshipRow[];

    return rows.map((r) => ({
      id: r.id,
      sourceType: r.source_type as any,
      sourceId: r.source_id,
      targetType: r.target_type as any,
      targetId: r.target_id,
      relationType: r.relation_type as any,
      metadata: r.metadata,
      reason: r.reason ?? null,
      createdByUserId: r.created_by_user_id ?? null,
      createdByName: r.created_by_name ?? null,
      createdAt: (r as any).created_at?.toISOString?.() ?? new Date().toISOString(),
    }));
  }

  /**
   * Compute the transitive closure of edges starting from a given source.
   * Returns all directly and indirectly reachable targets via recursive CTE.
   * Filters out soft-deleted relationships and prevents infinite loops.
   */
  public async getTransitiveClosure(sourceId: string, orgId: string): Promise<GraphEdge[]> {
    const { rows } = await this.db.raw<{ rows: TraversalRow[] }>(`
      WITH RECURSIVE
      traversal(source_type, source_id, target_type, target_id, relation_type, depth, path) AS (
        SELECT source_type, source_id, target_type, target_id, relation_type, 1,
               ARRAY[source_type || ':' || source_id]
        FROM ${TABLE_NAME}
        WHERE source_id = :sourceId
          AND organization_id = :orgId
          AND deleted_at IS NULL
        UNION ALL
        SELECT rr.source_type, rr.source_id, rr.target_type, rr.target_id, rr.relation_type, t.depth + 1,
               t.path || (rr.source_type || ':' || rr.source_id)
        FROM ${TABLE_NAME} rr
        JOIN traversal t ON rr.source_id = t.target_id
        WHERE t.depth < 10
          AND rr.organization_id = :orgId
          AND rr.deleted_at IS NULL
          AND NOT ((rr.source_type || ':' || rr.source_id) = ANY(t.path))
      )
      SELECT DISTINCT source_type, source_id, target_type, target_id, relation_type, depth FROM traversal
    `, { sourceId, orgId });

    return rows.map((r) => ({
      id: `${r.source_type}:${r.source_id}→${r.target_type}:${r.target_id}`,
      sourceType: r.source_type as any,
      sourceId: r.source_id,
      targetType: r.target_type as any,
      targetId: r.target_id,
      relationType: r.relation_type as any,
    }));
  }
}
