import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { Team, TeamRole } from '../domain/team.entity.js';
import type {
  CreateTeamData,
  ITeamRepository,
  UpdateTeamData,
} from '../infrastructure/team.repository.js';

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class TeamService {
  constructor(private readonly repository: ITeamRepository) {}

  async list(): Promise<Team[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Team> {
    const team = await this.repository.findById(id);
    if (!team) throw new NotFoundError('Time', id);
    return team;
  }

  async create(input: CreateTeamData, audit: AuditContext): Promise<Team> {
    const existing = await this.repository.findBySlug(input.slug);
    if (existing) throw new ConflictError(`Ja existe um time com o slug '${input.slug}'`);

    const team = await this.repository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'team.created',
      resourceType: 'team',
      resourceId: team.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: team.slug, name: team.name },
    });

    return team;
  }

  async update(id: string, input: UpdateTeamData, audit: AuditContext): Promise<Team> {
    await this.getById(id);

    const team = await this.repository.update(id, input);
    if (!team) throw new NotFoundError('Time', id);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'team.updated',
      resourceType: 'team',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { name: team.name },
    });

    return team;
  }

  async delete(id: string, audit: AuditContext): Promise<void> {
    const team = await this.getById(id);

    const deleted = await this.repository.softDelete(id);
    if (!deleted) return;

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'team.deleted',
      resourceType: 'team',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: team.slug, name: team.name },
    });
  }

  async bulkDelete(ids: string[], audit: AuditContext): Promise<number> {
    const count = await this.repository.bulkSoftDelete(ids);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'team.bulk_deleted',
      resourceType: 'team',
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { count, ids },
    });

    return count;
  }

  async addMember(
    teamId: string,
    userId: string,
    role: TeamRole,
    audit: AuditContext,
  ): Promise<Team> {
    await this.getById(teamId);

    const alreadyMember = await this.repository.isMember(teamId, userId);
    if (alreadyMember) {
      throw new ConflictError('Este usuario ja e membro deste time');
    }

    await this.repository.addMember(teamId, userId, role);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'team.member_added',
      resourceType: 'team',
      resourceId: teamId,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { userId, role },
    });

    return this.getById(teamId);
  }

  async removeMember(teamId: string, userId: string, audit: AuditContext): Promise<Team> {
    await this.getById(teamId);

    const removed = await this.repository.removeMember(teamId, userId);
    if (!removed) throw new NotFoundError('Membro no time', userId);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'team.member_removed',
      resourceType: 'team',
      resourceId: teamId,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { userId },
    });

    return this.getById(teamId);
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    role: TeamRole,
    audit: AuditContext,
  ): Promise<Team> {
    await this.getById(teamId);

    const updated = await this.repository.updateMemberRole(teamId, userId, role);
    if (!updated) throw new NotFoundError('Membro no time', userId);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'team.member_role_updated',
      resourceType: 'team',
      resourceId: teamId,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { userId, role },
    });

    return this.getById(teamId);
  }
}
