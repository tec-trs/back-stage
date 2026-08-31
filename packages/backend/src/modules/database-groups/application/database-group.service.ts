import { NotFoundError, ValidationError } from '@back-stage/shared';
import type { Knex } from 'knex';

import type {
  CreateDatabaseGroupDto,
  DatabaseGroup,
  DatabaseGroupDetail,
  UpdateDatabaseGroupDto,
} from '../domain/database-group.types.js';
import { DatabaseGroupRepository } from '../infrastructure/database-group.repository.js';

// Postgres unique_violation error code.
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === PG_UNIQUE_VIOLATION;
}

export class DatabaseGroupService {
  private repository: DatabaseGroupRepository;

  public constructor(private readonly db: Knex) {
    this.repository = new DatabaseGroupRepository(db);
  }

  async listGroups(organizationId: string): Promise<DatabaseGroup[]> {
    return this.repository.findAll(organizationId);
  }

  async createGroup(organizationId: string, userId: string | null, data: CreateDatabaseGroupDto): Promise<DatabaseGroup> {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Nome do agrupador é obrigatório');
    }

    try {
      return await this.repository.create(organizationId, userId, { ...data, name: data.name.trim() });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ValidationError(`Já existe um agrupador chamado "${data.name.trim()}"`);
      }
      throw err;
    }
  }

  async getGroup(groupId: string, organizationId: string): Promise<DatabaseGroup> {
    const group = await this.repository.findById(groupId, organizationId);
    if (!group) {
      throw new NotFoundError('Agrupador de bancos', groupId);
    }
    return group;
  }

  async getGroupDetail(groupId: string, organizationId: string): Promise<DatabaseGroupDetail> {
    const group = await this.getGroup(groupId, organizationId);
    const [members, applications] = await Promise.all([
      this.repository.getMembers(groupId),
      this.repository.getApplicationLinks(groupId),
    ]);
    return { ...group, members, applications };
  }

  async updateGroup(groupId: string, organizationId: string, data: UpdateDatabaseGroupDto): Promise<DatabaseGroup> {
    await this.getGroup(groupId, organizationId);

    if (data.name !== undefined && data.name.trim().length === 0) {
      throw new ValidationError('Nome do agrupador é obrigatório');
    }

    try {
      const updated = await this.repository.update(groupId, organizationId, {
        ...data,
        name: data.name !== undefined ? data.name.trim() : undefined,
      });
      if (!updated) {
        throw new NotFoundError('Agrupador de bancos', groupId);
      }
      return updated;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ValidationError(`Já existe um agrupador chamado "${data.name?.trim()}"`);
      }
      throw err;
    }
  }

  async deleteGroup(groupId: string, organizationId: string): Promise<void> {
    await this.getGroup(groupId, organizationId);
    const deleted = await this.repository.delete(groupId, organizationId);
    if (!deleted) {
      throw new NotFoundError('Agrupador de bancos', groupId);
    }
  }

  async addMember(groupId: string, organizationId: string, databaseId: string): Promise<DatabaseGroupDetail> {
    await this.getGroup(groupId, organizationId);

    const database = await this.db('databases').where({ id: databaseId, organization_id: organizationId, deleted_at: null }).first('id');
    if (!database) {
      throw new NotFoundError('Banco de dados', databaseId);
    }

    const alreadyMember = await this.repository.findActiveMember(groupId, databaseId);
    if (alreadyMember) {
      throw new ValidationError('Este banco já está neste agrupador');
    }

    try {
      await this.repository.addMember(groupId, organizationId, databaseId);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ValidationError('Este banco já está neste agrupador');
      }
      throw err;
    }

    return this.getGroupDetail(groupId, organizationId);
  }

  async removeMember(groupId: string, organizationId: string, memberId: string): Promise<DatabaseGroupDetail> {
    await this.getGroup(groupId, organizationId);

    const removed = await this.repository.removeMember(groupId, organizationId, memberId);
    if (!removed) {
      throw new ValidationError('Este banco não está neste agrupador');
    }

    return this.getGroupDetail(groupId, organizationId);
  }

  async addApplicationLink(groupId: string, organizationId: string, applicationId: string): Promise<DatabaseGroupDetail> {
    await this.getGroup(groupId, organizationId);

    const application = await this.db('applications')
      .where({ id: applicationId, organization_id: organizationId, deleted_at: null })
      .first('id');
    if (!application) {
      throw new NotFoundError('Aplicação', applicationId);
    }

    const alreadyLinked = await this.repository.findActiveApplicationLink(groupId, applicationId);
    if (alreadyLinked) {
      throw new ValidationError('Esta aplicação já está documentada neste agrupador');
    }

    try {
      await this.repository.addApplicationLink(groupId, organizationId, applicationId);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ValidationError('Esta aplicação já está documentada neste agrupador');
      }
      throw err;
    }

    return this.getGroupDetail(groupId, organizationId);
  }

  async removeApplicationLink(groupId: string, organizationId: string, linkId: string): Promise<DatabaseGroupDetail> {
    await this.getGroup(groupId, organizationId);

    const removed = await this.repository.removeApplicationLink(groupId, organizationId, linkId);
    if (!removed) {
      throw new ValidationError('Esta aplicação não está documentada neste agrupador');
    }

    return this.getGroupDetail(groupId, organizationId);
  }
}
