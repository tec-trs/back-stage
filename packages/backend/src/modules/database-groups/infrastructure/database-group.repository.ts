import type { Knex } from 'knex';

import type {
  CreateDatabaseGroupDto,
  DatabaseGroup,
  DatabaseGroupApplicationLink,
  DatabaseGroupMember,
  UpdateDatabaseGroupDto,
} from '../domain/database-group.types.js';

const GROUPS_TABLE = 'database_groups';
const MEMBERS_TABLE = 'database_group_members';
const APPLICATIONS_TABLE = 'database_group_applications';

export class DatabaseGroupRepository {
  public constructor(private readonly db: Knex) {}

  async create(organizationId: string, userId: string | null, data: CreateDatabaseGroupDto): Promise<DatabaseGroup> {
    const [row] = await this.db(GROUPS_TABLE)
      .insert({
        organization_id: organizationId,
        name: data.name,
        description: data.description || null,
        created_by_user_id: userId,
      })
      .returning('*');

    return this.toDto(row, 0, 0);
  }

  async findAll(organizationId: string): Promise<DatabaseGroup[]> {
    const rows = await this.db(GROUPS_TABLE)
      .select('database_groups.*')
      .select(this.db.raw('COUNT(DISTINCT dgm.id)::int as member_count'))
      .select(this.db.raw('COUNT(DISTINCT dga.id)::int as application_count'))
      .leftJoin(`${MEMBERS_TABLE} as dgm`, function () {
        this.on('dgm.group_id', '=', 'database_groups.id').andOnNull('dgm.deleted_at');
      })
      .leftJoin(`${APPLICATIONS_TABLE} as dga`, function () {
        this.on('dga.group_id', '=', 'database_groups.id').andOnNull('dga.deleted_at');
      })
      .where({ 'database_groups.organization_id': organizationId, 'database_groups.deleted_at': null })
      .groupBy('database_groups.id')
      .orderBy('database_groups.name');

    return rows.map((r) => this.toDto(r, Number(r.member_count ?? 0), Number(r.application_count ?? 0)));
  }

  async findById(groupId: string, organizationId: string): Promise<DatabaseGroup | null> {
    const row = await this.db(GROUPS_TABLE)
      .where({ id: groupId, organization_id: organizationId, deleted_at: null })
      .first();
    if (!row) return null;

    const [{ count: memberCount }] = await this.db(MEMBERS_TABLE)
      .where({ group_id: groupId, deleted_at: null })
      .count<{ count: string }[]>('id as count');
    const [{ count: applicationCount }] = await this.db(APPLICATIONS_TABLE)
      .where({ group_id: groupId, deleted_at: null })
      .count<{ count: string }[]>('id as count');

    return this.toDto(row, Number(memberCount ?? 0), Number(applicationCount ?? 0));
  }

  async update(groupId: string, organizationId: string, data: UpdateDatabaseGroupDto): Promise<DatabaseGroup | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    if (Object.keys(updateData).length === 0) {
      return this.findById(groupId, organizationId);
    }

    const [row] = await this.db(GROUPS_TABLE)
      .where({ id: groupId, organization_id: organizationId })
      .update(updateData)
      .returning('*');

    return row ? this.findById(groupId, organizationId) : null;
  }

  async delete(groupId: string, organizationId: string): Promise<boolean> {
    const result = await this.db(GROUPS_TABLE)
      .where({ id: groupId, organization_id: organizationId })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  async exists(groupId: string, organizationId: string): Promise<boolean> {
    const row = await this.db(GROUPS_TABLE)
      .where({ id: groupId, organization_id: organizationId, deleted_at: null })
      .first('id');
    return !!row;
  }

  async addMember(groupId: string, organizationId: string, databaseId: string): Promise<void> {
    await this.db(MEMBERS_TABLE).insert({
      group_id: groupId,
      database_id: databaseId,
      organization_id: organizationId,
    });
  }

  async findActiveMember(groupId: string, databaseId: string): Promise<boolean> {
    const row = await this.db(MEMBERS_TABLE)
      .where({ group_id: groupId, database_id: databaseId, deleted_at: null })
      .first('id');
    return !!row;
  }

  async removeMember(groupId: string, organizationId: string, memberId: string): Promise<boolean> {
    const result = await this.db(MEMBERS_TABLE)
      .where({ id: memberId, group_id: groupId, organization_id: organizationId, deleted_at: null })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  async addApplicationLink(groupId: string, organizationId: string, applicationId: string): Promise<void> {
    await this.db(APPLICATIONS_TABLE).insert({
      group_id: groupId,
      application_id: applicationId,
      organization_id: organizationId,
    });
  }

  async findActiveApplicationLink(groupId: string, applicationId: string): Promise<boolean> {
    const row = await this.db(APPLICATIONS_TABLE)
      .where({ group_id: groupId, application_id: applicationId, deleted_at: null })
      .first('id');
    return !!row;
  }

  async removeApplicationLink(groupId: string, organizationId: string, linkId: string): Promise<boolean> {
    const result = await this.db(APPLICATIONS_TABLE)
      .where({ id: linkId, group_id: groupId, organization_id: organizationId, deleted_at: null })
      .update({ deleted_at: this.db.fn.now() });

    return result > 0;
  }

  async getMembers(groupId: string): Promise<DatabaseGroupMember[]> {
    const rows = await this.db(`${MEMBERS_TABLE} as dgm`)
      .select(
        'dgm.id as membership_id',
        'd.id as database_id',
        'd.name as name',
        'd.display_name as display_name',
        'd.status as status',
        'd.criticality as criticality',
        'd.hosted_on_server_id as hosted_on_server_id',
        's.hostname as hosted_on_server_label',
      )
      .join('databases as d', 'd.id', 'dgm.database_id')
      .leftJoin('servers as s', 's.id', 'd.hosted_on_server_id')
      .where({ 'dgm.group_id': groupId, 'dgm.deleted_at': null })
      .whereNull('d.deleted_at')
      .orderBy('d.name');

    return rows.map((r) => ({
      id: r.membership_id,
      databaseId: r.database_id,
      name: r.name,
      displayName: r.display_name,
      status: r.status,
      criticality: r.criticality,
      hostedOnServerId: r.hosted_on_server_id,
      hostedOnServerLabel: r.hosted_on_server_label,
    }));
  }

  async getApplicationLinks(groupId: string): Promise<DatabaseGroupApplicationLink[]> {
    const rows = await this.db(`${APPLICATIONS_TABLE} as dga`)
      .select('dga.id as link_id', 'a.id as application_id', 'a.display_name as display_name', 'a.status as status')
      .join('applications as a', 'a.id', 'dga.application_id')
      .where({ 'dga.group_id': groupId, 'dga.deleted_at': null })
      .whereNull('a.deleted_at')
      .orderBy('a.display_name');

    return rows.map((r) => ({
      id: r.link_id,
      applicationId: r.application_id,
      displayName: r.display_name,
      status: r.status,
    }));
  }

  private toDto(row: any, memberCount: number, applicationCount: number): DatabaseGroup {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      createdByUserId: row.created_by_user_id,
      memberCount,
      applicationCount,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }
}
