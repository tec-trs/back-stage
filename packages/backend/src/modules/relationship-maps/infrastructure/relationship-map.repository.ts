import type { Knex } from 'knex';

import type {
  CreateRelationshipMapDto,
  ImplicitRelationshipKey,
  MapResourceType,
  RelationshipMap,
  RelationshipMapDetail,
  RelationshipMapEdge,
  RelationshipMapNode,
  UpdateRelationshipMapDto,
} from '../domain/relationship-map.types.js';

const MAPS_TABLE = 'relationship_maps';
const MEMBERS_TABLE = 'relationship_map_members';

interface ResourceRelationshipRow {
  id: string;
  source_type: MapResourceType;
  source_id: string;
  target_type: MapResourceType;
  target_id: string;
  relation_type: string;
  reason: string | null;
}

const RESOURCE_TABLE_BY_TYPE: Record<MapResourceType, { table: string; labelColumn: string }> = {
  server: { table: 'servers', labelColumn: 'hostname' },
  application: { table: 'applications', labelColumn: 'display_name' },
  database: { table: 'databases', labelColumn: 'display_name' },
  url: { table: 'urls', labelColumn: 'label' },
  vip: { table: 'vips', labelColumn: 'hostname' },
};

export class RelationshipMapRepository {
  public constructor(private readonly db: Knex) {}

  async create(organizationId: string, userId: string | null, data: CreateRelationshipMapDto): Promise<RelationshipMap> {
    const [row] = await this.db(MAPS_TABLE)
      .insert({
        organization_id: organizationId,
        name: data.name,
        description: data.description || null,
        created_by_user_id: userId,
      })
      .returning('*');

    return this.toDto(row, 0);
  }

  async findAll(organizationId: string): Promise<RelationshipMap[]> {
    const rows = await this.db(MAPS_TABLE)
      .select('relationship_maps.*')
      .select(this.db.raw('COUNT(rmm.id)::int as member_count'))
      .leftJoin(`${MEMBERS_TABLE} as rmm`, function () {
        this.on('rmm.map_id', '=', 'relationship_maps.id').andOnNull('rmm.deleted_at');
      })
      .where({ 'relationship_maps.organization_id': organizationId, 'relationship_maps.deleted_at': null })
      .groupBy('relationship_maps.id')
      .orderBy('relationship_maps.name');

    return rows.map((r) => this.toDto(r, Number(r.member_count ?? 0)));
  }

  async findById(mapId: string, organizationId: string): Promise<RelationshipMap | null> {
    const row = await this.db(MAPS_TABLE)
      .where({ id: mapId, organization_id: organizationId, deleted_at: null })
      .first();
    if (!row) return null;

    const [{ count }] = await this.db(MEMBERS_TABLE)
      .where({ map_id: mapId, deleted_at: null })
      .count<{ count: string }[]>('id as count');

    return this.toDto(row, Number(count ?? 0));
  }

  async update(mapId: string, organizationId: string, data: UpdateRelationshipMapDto): Promise<RelationshipMap | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    if (Object.keys(updateData).length === 0) {
      return this.findById(mapId, organizationId);
    }

    const [row] = await this.db(MAPS_TABLE)
      .where({ id: mapId, organization_id: organizationId })
      .update(updateData)
      .returning('*');

    return row ? this.findById(mapId, organizationId) : null;
  }

  async delete(mapId: string, organizationId: string): Promise<boolean> {
    const result = await this.db(MAPS_TABLE)
      .where({ id: mapId, organization_id: organizationId })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  async exists(mapId: string, organizationId: string): Promise<boolean> {
    const row = await this.db(MAPS_TABLE)
      .where({ id: mapId, organization_id: organizationId, deleted_at: null })
      .first('id');
    return !!row;
  }

  async addExplicitMember(mapId: string, organizationId: string, relationshipId: string): Promise<void> {
    await this.db(MEMBERS_TABLE).insert({
      map_id: mapId,
      relationship_id: relationshipId,
      organization_id: organizationId,
    });
  }

  async addImplicitMember(mapId: string, organizationId: string, key: ImplicitRelationshipKey): Promise<void> {
    await this.db(MEMBERS_TABLE).insert({
      map_id: mapId,
      organization_id: organizationId,
      source_type: key.sourceType,
      source_id: key.sourceId,
      target_type: key.targetType,
      target_id: key.targetId,
      relation_type: key.relationType,
    });
  }

  async findActiveExplicitMember(mapId: string, relationshipId: string): Promise<boolean> {
    const row = await this.db(MEMBERS_TABLE)
      .where({ map_id: mapId, relationship_id: relationshipId, deleted_at: null })
      .first('id');
    return !!row;
  }

  async findActiveImplicitMember(mapId: string, key: ImplicitRelationshipKey): Promise<boolean> {
    const row = await this.db(MEMBERS_TABLE)
      .where({
        map_id: mapId,
        source_type: key.sourceType,
        source_id: key.sourceId,
        target_type: key.targetType,
        target_id: key.targetId,
        relation_type: key.relationType,
        deleted_at: null,
      })
      .first('id');
    return !!row;
  }

  /**
   * Removes a member by the membership row's own id — works uniformly for both
   * an explicit member (points at a resource_relationships row) and an implicit
   * one (a natural-key snapshot), since neither has a relationship_id in the
   * implicit case.
   */
  async removeMember(mapId: string, organizationId: string, memberId: string): Promise<boolean> {
    const result = await this.db(MEMBERS_TABLE)
      .where({ id: memberId, map_id: mapId, organization_id: organizationId, deleted_at: null })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  /**
   * Resolves a map's tagged relationships into the {nodes, edges} shape the
   * architecture-diagram/Ecosystem graph rendering already expects, so the
   * frontend can reuse the same ReactFlow pipeline for a scoped map as it
   * does for the full live graph.
   */
  async getDetail(mapId: string, organizationId: string): Promise<{ edges: RelationshipMapEdge[]; nodes: RelationshipMapNode[] } | null> {
    const mapExists = await this.exists(mapId, organizationId);
    if (!mapExists) return null;

    const memberRows = await this.db(MEMBERS_TABLE)
      .where({ map_id: mapId, deleted_at: null })
      .orderBy('created_at', 'asc');

    const explicitIds = memberRows.filter((m) => m.relationship_id).map((m) => m.relationship_id as string);

    const relationshipById = new Map<string, ResourceRelationshipRow>();
    if (explicitIds.length > 0) {
      const relationshipRows = await this.db('resource_relationships')
        .select('id', 'source_type', 'source_id', 'target_type', 'target_id', 'relation_type', 'reason')
        .whereIn('id', explicitIds)
        .whereNull('deleted_at') as ResourceRelationshipRow[];
      for (const r of relationshipRows) relationshipById.set(r.id, r);
    }

    const edges: RelationshipMapEdge[] = [];
    for (const m of memberRows) {
      if (m.relationship_id) {
        // The tagged relationship may have since been deleted at the source
        // (e.g. removed from the Ecosystem graph) — skip it rather than showing
        // a broken row; the membership row itself is left for the user to notice
        // via a shrinking count and clean up explicitly.
        const r = relationshipById.get(m.relationship_id);
        if (!r) continue;

        edges.push({
          id: m.id,
          relationshipId: r.id,
          isImplicit: false,
          sourceType: r.source_type,
          sourceId: r.source_id,
          targetType: r.target_type,
          targetId: r.target_id,
          relationType: r.relation_type,
          reason: r.reason ?? null,
        });
      } else {
        edges.push({
          id: m.id,
          relationshipId: null,
          isImplicit: true,
          sourceType: m.source_type,
          sourceId: m.source_id,
          targetType: m.target_type,
          targetId: m.target_id,
          relationType: m.relation_type,
          reason: null,
        });
      }
    }

    const idsByType: Partial<Record<MapResourceType, Set<string>>> = {};
    for (const e of edges) {
      (idsByType[e.sourceType] ??= new Set()).add(e.sourceId);
      (idsByType[e.targetType] ??= new Set()).add(e.targetId);
    }

    const nodes: RelationshipMapNode[] = [];
    for (const [type, ids] of Object.entries(idsByType) as [MapResourceType, Set<string>][]) {
      const meta = RESOURCE_TABLE_BY_TYPE[type];
      if (!meta || ids.size === 0) continue;

      const rows = await this.db(meta.table)
        .select('id', `${meta.labelColumn} as label`, 'status', ...(type === 'server' ? ['services'] : []))
        .whereIn('id', Array.from(ids))
        .whereNull('deleted_at');

      for (const row of rows) {
        nodes.push({
          id: row.id,
          resourceType: type,
          label: row.label,
          status: row.status,
          services: type === 'server' ? (row.services ?? []) : undefined,
        });
      }
    }

    return { nodes, edges };
  }

  private toDto(row: any, memberCount: number): RelationshipMap {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      createdByUserId: row.created_by_user_id,
      memberCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }
}

export type { RelationshipMapDetail };
