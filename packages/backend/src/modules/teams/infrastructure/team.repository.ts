import type { Knex } from 'knex';

import { Team, type TeamMemberRow, type TeamRole, type TeamRow } from '../domain/team.entity.js';

export interface CreateTeamData {
  name: string;
  slug: string;
  description?: string | null;
}

export interface UpdateTeamData {
  name?: string;
  description?: string | null;
}

export interface ITeamRepository {
  findAll(): Promise<Team[]>;
  findById(id: string): Promise<Team | null>;
  findBySlug(slug: string): Promise<TeamRow | null>;
  create(data: CreateTeamData): Promise<Team>;
  update(id: string, data: UpdateTeamData): Promise<Team | null>;
  softDelete(id: string): Promise<boolean>;
  isMember(teamId: string, userId: string): Promise<boolean>;
  addMember(teamId: string, userId: string, role: TeamRole): Promise<void>;
  removeMember(teamId: string, userId: string): Promise<boolean>;
  updateMemberRole(teamId: string, userId: string, role: TeamRole): Promise<boolean>;
}

export class TeamRepository implements ITeamRepository {
  constructor(private readonly db: Knex) {}

  private async membersFor(teamIds: string[]): Promise<TeamMemberRow[]> {
    if (teamIds.length === 0) return [];
    return this.db('team_members as tm')
      .join('users as u', 'u.id', 'tm.user_id')
      .select<TeamMemberRow[]>(
        'tm.team_id',
        'tm.role',
        'u.id as user_id',
        'u.full_name',
        'u.email',
        'u.code',
        'u.is_active',
      )
      .whereIn('tm.team_id', teamIds)
      .whereNull('tm.deleted_at')
      .whereNull('u.deleted_at')
      .orderBy('u.full_name', 'asc');
  }

  async findAll(): Promise<Team[]> {
    const rows = await this.db<TeamRow>('teams')
      .whereNull('deleted_at')
      .orderBy('name', 'asc');

    const memberRows = await this.membersFor(rows.map((r) => r.id));

    return rows.map((row) => {
      const members = memberRows.filter((m) => m.team_id === row.id);
      return new Team(row, members);
    });
  }

  async findById(id: string): Promise<Team | null> {
    const row = await this.db<TeamRow>('teams').where({ id }).whereNull('deleted_at').first();
    if (!row) return null;

    const memberRows = await this.membersFor([id]);
    return new Team(row, memberRows);
  }

  async findBySlug(slug: string): Promise<TeamRow | null> {
    const row = await this.db<TeamRow>('teams').where({ slug }).whereNull('deleted_at').first();
    return row ?? null;
  }

  async create(data: CreateTeamData): Promise<Team> {
    const [row] = await this.db<TeamRow>('teams')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        metadata: {} as Record<string, unknown>,
      })
      .returning('*');
    return new Team(row, []);
  }

  async update(id: string, data: UpdateTeamData): Promise<Team | null> {
    const patch: Partial<TeamRow> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;

    const [row] = await this.db<TeamRow>('teams')
      .where({ id })
      .whereNull('deleted_at')
      .update(patch)
      .returning('*');

    if (!row) return null;
    const memberRows = await this.membersFor([id]);
    return new Team(row, memberRows);
  }

  async softDelete(id: string): Promise<boolean> {
    const count = await this.db('teams')
      .where({ id })
      .whereNull('deleted_at')
      .update({ deleted_at: this.db.fn.now() });
    return count > 0;
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const row = await this.db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .whereNull('deleted_at')
      .first();
    return Boolean(row);
  }

  async addMember(teamId: string, userId: string, role: TeamRole): Promise<void> {
    await this.db('team_members').insert({
      team_id: teamId,
      user_id: userId,
      role,
      metadata: JSON.stringify({}),
    });
  }

  async removeMember(teamId: string, userId: string): Promise<boolean> {
    const count = await this.db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .whereNull('deleted_at')
      .update({ deleted_at: this.db.fn.now() });
    return count > 0;
  }

  async updateMemberRole(teamId: string, userId: string, role: TeamRole): Promise<boolean> {
    const count = await this.db('team_members')
      .where({ team_id: teamId, user_id: userId })
      .whereNull('deleted_at')
      .update({ role });
    return count > 0;
  }
}
