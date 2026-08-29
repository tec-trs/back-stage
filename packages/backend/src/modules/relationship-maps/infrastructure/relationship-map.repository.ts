import type { Knex } from 'knex';

import type {
  CreateRelationshipMapDto,
  MapResourceType,
  RelationshipMap,
  RelationshipMapDetail,
  RelationshipMapEdge,
  RelationshipMapNode,
  UpdateRelationshipMapDto,
} from '../domain/relationship-map.types.js';

const MAPS_TABLE = 'relationship_maps';
const MEMBERS_TABLE = 'relationship_map_members';

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

  async addMember(mapId: string, organizationId: string, relationshipId: string): Promise<void> {
    await this.db(MEMBERS_TABLE).insert({
      map_id: mapId,
      relationship_id: relationshipId,
      organization_id: organizationId,
    });
  }

  async findActiveMember(mapId: string, relationshipId: string): Promise<boolean> {
    const row = await this.db(MEMBERS_TABLE)
      .where({ map_id: mapId, relationship_id: relationshipId, deleted_at: null })
      .first('id');
    return !!row;
  }

  async removeMember(mapId: string, organizationId: string, relationshipId: string): Promise<boolean> {
    const result = await this.db(MEMBERS_TABLE)
      .where({ map_id: mapId, relationship_id: relationshipId, organization_id: organizationId, deleted_at: null })
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

    const relationshipRows = await this.db(MEMBERS_TABLE)
      .join('resource_relationships as rr', 'rr.id', `${MEMBERS_TABLE}.relationship_id`)
      .select('rr.*')
      .where({
        [`${MEMBERS_TABLE}.map_id`]: mapId,
        [`${MEMBERS_TABLE}.deleted_at`]: null,
      })
      .whereNull('rr.deleted_at');

    const edges: RelationshipMapEdge[] = relationshipRows.map((r) => ({
      id: r.id,
      relationshipId: r.id,
      sourceType: r.source_type,
      sourceId: r.source_id,
      targetType: r.target_type,
      targetId: r.target_id,
      relationType: r.relation_type,
      reason: r.reason ?? null,
    }));

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
        .select('id', `${meta.labelColumn} as label`, 'status')
        .whereIn('id', Array.from(ids))
        .whereNull('deleted_at');

      for (const row of rows) {
        nodes.push({ id: row.id, resourceType: type, label: row.label, status: row.status });
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
