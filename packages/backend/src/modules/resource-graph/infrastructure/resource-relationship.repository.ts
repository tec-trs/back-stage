import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';
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

  private buildResourceUnion(orgId: string): string {
    return `
      SELECT id, 'server' as type, hostname as label, status, null::text as criticality, environment, null::uuid as hosted_on_server_id, monitoring_url FROM servers WHERE deleted_at IS NULL AND organization_id = '${orgId}'
      UNION ALL
      SELECT id, 'application' as type, display_name as label, status, criticality, null::text as environment, null::uuid as hosted_on_server_id, monitoring_url FROM applications WHERE deleted_at IS NULL AND organization_id = '${orgId}'
      UNION ALL
      SELECT id, 'database' as type, display_name as label, status, criticality, environment, hosted_on_server_id, monitoring_url FROM databases WHERE deleted_at IS NULL AND organization_id = '${orgId}'
      UNION ALL
      SELECT id, 'url' as type, label, status, null::text as criticality, null::text as environment, null::uuid as hosted_on_server_id, null::text as monitoring_url FROM urls WHERE deleted_at IS NULL AND organization_id = '${orgId}'
    `;
  }

  public async getFullGraph(
    filters: GraphFilters,
    _pagination: Pagination,
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[]; total: number }> {
    const nodeLimit = MAX_GRAPH_NODES_DEFAULT;
    const orgId = orgContext.getOrThrow();

    let nodeQuery = this.db
      .select('id', 'type', 'label', 'status', 'criticality', 'environment', 'hosted_on_server_id', 'monitoring_url')
      .from(this.db.raw(`(${this.buildResourceUnion(orgId)}) as all_resources`));

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
      .from(this.db.raw(`(${this.buildResourceUnion(orgId)}) as all_resources`));

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
      return { nodes: [], edges: [], total };
    }

    const nodes = await nodeQuery as ResourceRow[];

    // Explicit relationships stored in resource_relationships
    const explicitEdges = await this.db(TABLE_NAME)
      .select('*')
      .where('organization_id', orgId)
      .whereNull('deleted_at') as RelationshipRow[];

    // Implicit edges from application_deployments (server → hosts → application)
    interface DeploymentRow { server_id: string; application_id: string }
    const deployments = await this.db('application_deployments')
      .select('server_id', 'application_id')
      .where('organization_id', orgId)
      .whereNull('deleted_at')
      .whereRaw('(SELECT deleted_at FROM applications WHERE id = application_id) IS NULL') as DeploymentRow[];

    // Implicit edges from urls (owner_resource → exposes → url)
    interface UrlRow { id: string; owner_resource_type: string; owner_resource_id: string }
    const urlEdges = await this.db('urls')
      .select('id', 'owner_resource_type', 'owner_resource_id')
      .where('organization_id', orgId)
      .whereNull('deleted_at') as UrlRow[];

    const mappedExplicit = explicitEdges.map((e) => ({
      id: e.id,
      sourceType: e.source_type,
      sourceId: e.source_id,
      targetType: e.target_type,
      targetId: e.target_id,
      relationType: e.relation_type as any,
      metadata: e.metadata,
    }));

    const mappedDeployments: GraphEdge[] = deployments.map((d) => ({
      id: `deploy:${d.server_id}:${d.application_id}`,
      sourceType: 'server' as const,
      sourceId: d.server_id,
      targetType: 'application' as const,
      targetId: d.application_id,
      relationType: 'hosts' as any,
    }));

    const mappedUrls: GraphEdge[] = urlEdges.map((u) => ({
      id: `url-owner:${u.owner_resource_id}:${u.id}`,
      sourceType: u.owner_resource_type as any,
      sourceId: u.owner_resource_id,
      targetType: 'url' as const,
      targetId: u.id,
      relationType: 'exposes' as any,
    }));

    // Deduplicate: explicit relationships that duplicate an implicit one take precedence
    const implicitKeys = new Set([
      ...mappedDeployments.map((e) => `${e.sourceId}:${e.targetId}:hosts`),
      ...mappedUrls.map((e) => `${e.sourceId}:${e.targetId}:exposes`),
    ]);
    const deduped = mappedExplicit.filter(
      (e) => !implicitKeys.has(`${e.sourceId}:${e.targetId}:${e.relationType}`),
    );

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
      edges: [...deduped, ...mappedDeployments, ...mappedUrls],
      total,
    };
  }

  public async getSubgraph(
    rootType: ResourceType,
    rootId: string,
    options: { depth?: number; direction?: 'upstream' | 'downstream' | 'both'; relationType?: string } = {},
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    const { depth = 2, direction = 'both', relationType } = options;
    const maxDepth = Math.min(depth, MAX_DEPTH_DEFAULT);

    const relationFilter = relationType ? `AND relation_type = :relationType` : '';

    const baseWhere = direction === 'downstream'
      ? `source_type = :rootType AND source_id = :rootId`
      : direction === 'upstream'
        ? `target_type = :rootType AND target_id = :rootId`
        : `(source_type = :rootType AND source_id = :rootId) OR (target_type = :rootType AND target_id = :rootId)`;

    const recursiveJoin = direction === 'downstream'
      ? `rr.source_type = t.target_type AND rr.source_id = t.target_id`
      : direction === 'upstream'
        ? `rr.target_type = t.source_type AND rr.target_id = t.source_id`
        : `(rr.source_type = t.target_type AND rr.source_id = t.target_id) OR (rr.target_type = t.source_type AND rr.target_id = t.source_id)`;

    const orgId = orgContext.getOrThrow();
    const { rows } = await this.db.raw<{ rows: TraversalRow[] }>(`
      WITH RECURSIVE
      all_edges(source_type, source_id, target_type, target_id, relation_type) AS (
        SELECT source_type::text, source_id::text, target_type::text, target_id::text, relation_type
        FROM ${TABLE_NAME}
        WHERE deleted_at IS NULL AND organization_id = :orgId
        UNION ALL
        SELECT 'server', ad.server_id::text, 'application', ad.application_id::text, 'hosts'
        FROM application_deployments ad
        JOIN applications a ON a.id = ad.application_id AND a.deleted_at IS NULL AND a.organization_id = :orgId
        WHERE ad.deleted_at IS NULL AND ad.organization_id = :orgId
        UNION ALL
        SELECT u.owner_resource_type::text, u.owner_resource_id::text, 'url', u.id::text, 'exposes'
        FROM urls u
        WHERE u.deleted_at IS NULL AND u.organization_id = :orgId
      ),
      traversal(source_type, source_id, target_type, target_id, relation_type, depth, path) AS (
        SELECT source_type, source_id, target_type, target_id, relation_type, 1,
               ARRAY[source_type || ':' || source_id]
        FROM all_edges
        WHERE (${baseWhere})
          ${relationFilter}
        UNION ALL
        SELECT ae.source_type, ae.source_id, ae.target_type, ae.target_id, ae.relation_type, t.depth + 1,
               t.path || (ae.source_type || ':' || ae.source_id)
        FROM all_edges ae
        JOIN traversal t ON ${recursiveJoin.replace(/rr\./g, 'ae.')}
        WHERE t.depth < :maxDepth
          ${relationFilter}
          AND NOT ((ae.source_type || ':' || ae.source_id) = ANY(t.path))
      )
      SELECT DISTINCT source_type, source_id, target_type, target_id, relation_type, depth FROM traversal
    `, { rootType, rootId, maxDepth, orgId, ...(relationType ? { relationType } : {}) });

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

    // all_edges unifies explicit relationships with two implicit edge sources:
    //   - application_deployments  (server → hosts → application)
    //   - urls.owner_resource_id   (owner  → exposes → url)
    //
    // Impact direction semantics:
    //   depends_on / connects_to / consumes:
    //     source depends on target → if TARGET goes down, SOURCE is affected
    //     → initial seed: WHERE target = root  → collect source
    //   hosts / exposes:
    //     source provides to target → if SOURCE goes down, TARGET is affected
    //     → initial seed: WHERE source = root  → collect target
    const orgId = orgContext.getOrThrow();
    const { rows } = await this.db.raw<{ rows: ImpactRow[] }>(`
      WITH RECURSIVE
      all_edges(source_type, source_id, target_type, target_id, relation_type) AS (
        SELECT source_type::text, source_id::text, target_type::text, target_id::text, relation_type
        FROM ${TABLE_NAME}
        WHERE deleted_at IS NULL AND organization_id = :orgId
        UNION ALL
        SELECT 'server', ad.server_id::text, 'application', ad.application_id::text, 'hosts'
        FROM application_deployments ad
        JOIN applications a ON a.id = ad.application_id AND a.deleted_at IS NULL AND a.organization_id = :orgId
        WHERE ad.deleted_at IS NULL AND ad.organization_id = :orgId
        UNION ALL
        SELECT u.owner_resource_type::text, u.owner_resource_id::text, 'url', u.id::text, 'exposes'
        FROM urls u
        WHERE u.deleted_at IS NULL AND u.organization_id = :orgId
      ),
      impact(resource_type, resource_id, depth, path) AS (
        SELECT
          CASE WHEN relation_type IN ('depends_on','connects_to','consumes')
               THEN source_type ELSE target_type END,
          CASE WHEN relation_type IN ('depends_on','connects_to','consumes')
               THEN source_id ELSE target_id END,
          1,
          ARRAY[:rootType || ':' || :rootId]
        FROM all_edges
        WHERE (target_type = :rootType AND target_id = :rootId AND relation_type IN ('depends_on','connects_to','consumes'))
           OR (source_type = :rootType AND source_id = :rootId AND relation_type IN ('hosts','exposes'))

        UNION ALL

        SELECT
          CASE WHEN ae.relation_type IN ('depends_on','connects_to','consumes')
               THEN ae.source_type ELSE ae.target_type END,
          CASE WHEN ae.relation_type IN ('depends_on','connects_to','consumes')
               THEN ae.source_id ELSE ae.target_id END,
          i.depth + 1,
          i.path || (i.resource_type || ':' || i.resource_id)
        FROM all_edges ae
        JOIN impact i ON (
          (ae.relation_type IN ('depends_on','connects_to','consumes')
            AND ae.target_type = i.resource_type AND ae.target_id = i.resource_id)
          OR
          (ae.relation_type IN ('hosts','exposes')
            AND ae.source_type = i.resource_type AND ae.source_id = i.resource_id)
        )
        WHERE i.depth < :maxDepth
          AND NOT ((i.resource_type || ':' || i.resource_id) = ANY(i.path))
      )
      SELECT resource_type, resource_id, MIN(depth) AS min_depth
      FROM impact
      GROUP BY resource_type, resource_id
    `, { rootType, rootId, maxDepth: effectiveMaxDepth, orgId });

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

  public async listRelationships(filters: {
    sourceType?: ResourceType;
    sourceId?: string;
    targetType?: ResourceType;
    targetId?: string;
    relationType?: string;
  }): Promise<GraphEdge[]> {
    let query = this.db(TABLE_NAME)
      .select('*')
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at');
    if (filters.sourceType) query = query.where('source_type', filters.sourceType);
    if (filters.sourceId)   query = query.where('source_id',   filters.sourceId);
    if (filters.targetType) query = query.where('target_type', filters.targetType);
    if (filters.targetId)   query = query.where('target_id',   filters.targetId);
    if (filters.relationType) query = query.where('relation_type', filters.relationType);

    const rows = (await query) as RelationshipRow[];
    return rows.map((r) => ({
      id: r.id,
      sourceType: r.source_type,
      sourceId:   r.source_id,
      targetType: r.target_type,
      targetId:   r.target_id,
      relationType: r.relation_type as any,
      metadata: r.metadata,
    }));
  }

  public async createRelationship(
    sourceType: ResourceType,
    sourceId: string,
    targetType: ResourceType,
    targetId: string,
    relationType: string,
    metadata?: Record<string, unknown>,
  ): Promise<GraphEdge> {
    const [row] = (await this.db(TABLE_NAME)
      .insert({
        organization_id: orgContext.getOrThrow(),
        source_type: sourceType,
        source_id: sourceId,
        target_type: targetType,
        target_id: targetId,
        relation_type: relationType,
        metadata: metadata ?? {},
      })
      .returning('id')) as { id: string }[];

    return {
      id: row.id,
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

  public async syncHostRelationship(
    serverId: string | null,
    targetType: ResourceType,
    targetId: string,
  ): Promise<void> {
    await this.db(TABLE_NAME)
      .where({ target_type: targetType, target_id: targetId, relation_type: 'hosts' })
      .whereNull('deleted_at')
      .update({ deleted_at: this.db.fn.now() });

    if (serverId) {
      await this.db(TABLE_NAME).insert({
        source_type: 'server',
        source_id: serverId,
        target_type: targetType,
        target_id: targetId,
        relation_type: 'hosts',
        metadata: {},
      });
    }
  }
}
