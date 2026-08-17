import type { Knex } from 'knex';

import type {
  GraphEdge,
  GraphFilters,
  GraphNode,
  ImpactNode,
  ImpactResult,
  Pagination,
  ResourceType,
} from '../domain/graph.types.js';

const TABLE_NAME = 'resource_relationships';
const MAX_DEPTH_DEFAULT = 10;
const MAX_GRAPH_NODES_DEFAULT = 500;

interface ResourceRow {
  id: string;
  type: ResourceType;
  label: string;
  status?: string;
  criticality?: string;
  environment?: string;
  hosted_on_server_id?: string | null;
  monitoring_url?: string | null;
}

interface RelationshipRow {
  id: string;
  source_type: ResourceType;
  source_id: string;
  target_type: ResourceType;
  target_id: string;
  relation_type: string;
  metadata?: Record<string, unknown>;
}

interface TraversalRow {
  source_type: ResourceType;
  source_id: string;
  target_type: ResourceType;
  target_id: string;
  relation_type: string;
  depth: number;
}

interface ImpactRow {
  resource_type: ResourceType;
  resource_id: string;
  min_depth: number;
}

export class ResourceRelationshipRepository {
  public constructor(private readonly db: Knex) {}

  private async getResourceNode(resourceType: ResourceType, resourceId: string): Promise<GraphNode | null> {
    let table: string;
    let labelColumn: string;

    switch (resourceType) {
      case 'server':
        table = 'servers';
        labelColumn = 'hostname';
        break;
      case 'application':
        table = 'applications';
        labelColumn = 'display_name';
        break;
      case 'database':
        table = 'databases';
        labelColumn = 'display_name';
        break;
      case 'url':
        table = 'urls';
        labelColumn = 'label';
        break;
      default:
        return null;
    }

    const selectCols = [
      this.db.raw(`'${resourceType}' as resource_type`),
      'id',
      `${labelColumn} as label`,
      'status',
      ...(resourceType === 'application' || resourceType === 'database' ? ['criticality'] : []),
      ...(resourceType === 'server' || resourceType === 'database' ? ['environment'] : []),
      ...(resourceType === 'database' ? ['hosted_on_server_id'] : []),
      ...(resourceType === 'server' || resourceType === 'database' ? ['monitoring_url'] : []),
    ];

    const row = await this.db(table)
      .select(...selectCols)
      .where('id', resourceId)
      .whereNull('deleted_at')
      .first();

    if (!row) {
      return null;
    }

    return {
      id: row.id,
      resourceType,
      label: row.label,
      status: row.status,
      criticality: row.criticality,
      environment: row.environment,
      hostedOnServerId: row.hosted_on_server_id,
      monitoringUrl: row.monitoring_url,
    };
  }

  private buildResourceUnion(): string {
    return `
      SELECT id, 'server' as type, hostname as label, status, null::text as criticality, environment, null::uuid as hosted_on_server_id, monitoring_url FROM servers WHERE deleted_at IS NULL
      UNION ALL
      SELECT id, 'application' as type, display_name as label, status, criticality, null::text as environment, null::uuid as hosted_on_server_id, monitoring_url FROM applications WHERE deleted_at IS NULL
      UNION ALL
      SELECT id, 'database' as type, display_name as label, status, criticality, environment, hosted_on_server_id, monitoring_url FROM databases WHERE deleted_at IS NULL
      UNION ALL
      SELECT id, 'url' as type, label, status, null::text as criticality, null::text as environment, null::uuid as hosted_on_server_id, null::text as monitoring_url FROM urls WHERE deleted_at IS NULL
    `;
  }

  public async getFullGraph(
    filters: GraphFilters,
    _pagination: Pagination,
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[]; total: number }> {
    const nodeLimit = MAX_GRAPH_NODES_DEFAULT;

    let nodeQuery = this.db
      .select('id', 'type', 'label', 'status', 'criticality', 'environment', 'hosted_on_server_id', 'monitoring_url')
      .from(this.db.raw(`(${this.buildResourceUnion()}) as all_resources`));

    if (filters.resourceTypes && filters.resourceTypes.length > 0) {
      nodeQuery = nodeQuery.whereIn('type', filters.resourceTypes);
    }
    if (filters.environment) {
      nodeQuery = nodeQuery.where('environment', filters.environment);
    }
    if (filters.criticality) {
      nodeQuery = nodeQuery.where('criticality', filters.criticality);
    }
    if (filters.status) {
      nodeQuery = nodeQuery.where('status', filters.status);
    }

    const countQuery = this.db
      .select(this.db.raw('COUNT(*) as count'))
      .from(this.db.raw(`(${this.buildResourceUnion()}) as all_resources`));

    if (filters.resourceTypes && filters.resourceTypes.length > 0) {
      countQuery.whereIn('type', filters.resourceTypes);
    }
    if (filters.environment) {
      countQuery.where('environment', filters.environment);
    }
    if (filters.criticality) {
      countQuery.where('criticality', filters.criticality);
    }
    if (filters.status) {
      countQuery.where('status', filters.status);
    }

    const countResult = await countQuery;
    const total = Number(countResult[0]?.count ?? 0);

    if (total > nodeLimit) {
      return {
        nodes: [],
        edges: [],
        total,
      };
    }

    const nodes = await nodeQuery as ResourceRow[];

    let edgeQuery = this.db(TABLE_NAME).select('*').whereNull('deleted_at');

    const edges = await edgeQuery as RelationshipRow[];

    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        resourceType: n.type,
        label: n.label,
        status: n.status,
        criticality: n.criticality,
        environment: n.environment,
        hostedOnServerId: n.hosted_on_server_id,
        monitoringUrl: n.monitoring_url,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        sourceType: e.source_type,
        sourceId: e.source_id,
        targetType: e.target_type,
        targetId: e.target_id,
        relationType: e.relation_type as any,
        metadata: e.metadata,
      })),
      total,
    };
  }

  public async getSubgraph(
    rootType: ResourceType,
    rootId: string,
    depth: number = 2,
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const maxDepth = Math.min(depth, MAX_DEPTH_DEFAULT);

    const rows = await this.db.raw<TraversalRow[]>(`
      WITH RECURSIVE traversal(source_type, source_id, target_type, target_id, relation_type, depth, path) AS (
        SELECT source_type, source_id, target_type, target_id, relation_type, 1,
               ARRAY[source_type || ':' || source_id]
        FROM ${TABLE_NAME}
        WHERE deleted_at IS NULL
          AND ((source_type = :rootType AND source_id = :rootId) OR (target_type = :rootType AND target_id = :rootId))
        UNION ALL
        SELECT rr.source_type, rr.source_id, rr.target_type, rr.target_id, rr.relation_type, t.depth + 1,
               t.path || (rr.source_type || ':' || rr.source_id)
        FROM ${TABLE_NAME} rr
        JOIN traversal t ON (rr.source_type = t.target_type AND rr.source_id = t.target_id)
                         OR (rr.target_type = t.source_type AND rr.target_id = t.source_id)
        WHERE rr.deleted_at IS NULL
          AND t.depth < :maxDepth
          AND NOT ((rr.source_type || ':' || rr.source_id) = ANY(t.path))
      )
      SELECT DISTINCT source_type, source_id, target_type, target_id, relation_type, depth FROM traversal
    `, { rootType, rootId, maxDepth });

    const uniqueResourceIds = new Set<string>();
    uniqueResourceIds.add(`${rootType}:${rootId}`);

    for (const row of rows) {
      uniqueResourceIds.add(`${row.source_type}:${row.source_id}`);
      uniqueResourceIds.add(`${row.target_type}:${row.target_id}`);
    }

    const nodes: GraphNode[] = [];
    const root = await this.getResourceNode(rootType, rootId);
    if (root) nodes.push(root);

    for (const resourceId of uniqueResourceIds) {
      if (resourceId === `${rootType}:${rootId}`) continue;
      const [type, id] = resourceId.split(':') as [ResourceType, string];
      const node = await this.getResourceNode(type, id);
      if (node) nodes.push(node);
    }

    const edges = rows.map((r) => ({
      id: `${r.source_type}:${r.source_id}→${r.target_type}:${r.target_id}`,
      sourceType: r.source_type,
      sourceId: r.source_id,
      targetType: r.target_type,
      targetId: r.target_id,
      relationType: r.relation_type as any,
    }));

    return { nodes, edges };
  }

  public async getTransitiveImpact(
    rootType: ResourceType,
    rootId: string,
    maxDepth: number = MAX_DEPTH_DEFAULT,
  ): Promise<ImpactResult> {
    const effectiveMaxDepth = Math.min(maxDepth, MAX_DEPTH_DEFAULT);

    const rows = await this.db.raw<ImpactRow[]>(`
      WITH RECURSIVE impact(resource_type, resource_id, depth, path) AS (
        SELECT source_type, source_id, 1,
               ARRAY[target_type || ':' || target_id]
        FROM ${TABLE_NAME}
        WHERE deleted_at IS NULL
          AND target_type = :rootType AND target_id = :rootId
          AND relation_type IN ('depends_on', 'hosts', 'connects_to', 'consumes')
        UNION ALL
        SELECT rr.source_type, rr.source_id, i.depth + 1, i.path || (rr.target_type || ':' || rr.target_id)
        FROM ${TABLE_NAME} rr
        JOIN impact i ON rr.target_type = i.resource_type AND rr.target_id = i.resource_id
        WHERE rr.deleted_at IS NULL
          AND rr.relation_type IN ('depends_on', 'hosts', 'connects_to', 'consumes')
          AND i.depth < :maxDepth
          AND NOT ((rr.target_type || ':' || rr.target_id) = ANY(i.path))
      )
      SELECT resource_type, resource_id, MIN(depth) AS min_depth FROM impact GROUP BY resource_type, resource_id
    `, { rootType, rootId, maxDepth: effectiveMaxDepth });

    const impactedResources: ImpactNode[] = [];
    const byType: Record<ResourceType, number> = {
      server: 0,
      application: 0,
      database: 0,
      url: 0,
    };
    const byDepth: Record<number, ImpactNode[]> = {};

    for (const row of rows) {
      const node = await this.getResourceNode(row.resource_type, row.resource_id);
      if (node) {
        const impactNode: ImpactNode = {
          resourceType: row.resource_type,
          resourceId: row.resource_id,
          depth: row.min_depth,
          label: node.label,
          status: node.status,
          criticality: node.criticality,
        };
        impactedResources.push(impactNode);
        byType[row.resource_type]++;

        if (!byDepth[row.min_depth]) {
          byDepth[row.min_depth] = [];
        }
        byDepth[row.min_depth].push(impactNode);
      }
    }

    return {
      impactedResources,
      hasCycle: false,
      totalImpacted: impactedResources.length,
      byType,
      byDepth,
    };
  }

  public async createRelationship(
    sourceType: ResourceType,
    sourceId: string,
    targetType: ResourceType,
    targetId: string,
    relationType: string,
    metadata?: Record<string, unknown>,
  ): Promise<GraphEdge> {
    const [id] = await this.db(TABLE_NAME).insert({
      source_type: sourceType,
      source_id: sourceId,
      target_type: targetType,
      target_id: targetId,
      relation_type: relationType,
      metadata: metadata ?? {},
    });

    return {
      id: String(id),
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationType: relationType as any,
      metadata,
    };
  }

  public async deleteRelationship(id: string): Promise<boolean> {
    const result = await this.db(TABLE_NAME).where({ id }).delete();
    return result > 0;
  }
}
