import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import { ResourceRelationshipRepository } from '../../resource-graph/infrastructure/resource-relationship.repository.js';
import type { Database } from '../domain/database.entity.js';
import type {
  CreateDatabaseInput,
  DatabaseFilters,
  IDatabaseRepository,
  Pagination,
  UpdateDatabaseInput,
} from '../infrastructure/database.repository.js';

export interface ListDatabasesResult {
  items: Database[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}


function generateDatabaseCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DB-${timestamp}-${random}`;
}

export class DatabaseService {
  public constructor(
    private readonly databaseRepository: IDatabaseRepository,
    private readonly graphRepository: ResourceRelationshipRepository,
  ) {}

  public async list(filters: DatabaseFilters, pagination: Pagination): Promise<ListDatabasesResult> {
    const { items, total } = await this.databaseRepository.findMany(filters, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<Database> {
    const database = await this.databaseRepository.findById(id);
    if (!database) {
      throw new NotFoundError('Banco de dados', id);
    }
    return database;
  }

  public async create(input: CreateDatabaseInput, audit: AuditContext): Promise<Database> {
    const existing = await this.databaseRepository.findByNameAndLocation(
      input.name,
      input.hostedOnServerId ?? null,
      input.port ?? null,
    );
    if (existing) {
      throw new ConflictError(
        `Ja existe um banco de dados chamado '${input.name}' neste servidor, nesta porta`,
      );
    }

    // Generate code if not provided
    const inputWithCode = {
      ...input,
      code: generateDatabaseCode(),
    };

    const database = await this.databaseRepository.create(inputWithCode as any);

    if (input.hostedOnServerId) {
      await this.graphRepository.syncHostRelationship(input.hostedOnServerId, 'database', database.id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'database.created',
      resourceType: 'database',
      resourceId: database.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { name: database.name },
    });

    return database;
  }

  public async update(id: string, input: UpdateDatabaseInput, audit: AuditContext): Promise<Database> {
    const current = await this.getById(id);

    if (input.name !== undefined || input.hostedOnServerId !== undefined || input.port !== undefined) {
      const effectiveName = input.name ?? current.name;
      const effectiveServerId = input.hostedOnServerId !== undefined ? input.hostedOnServerId : current.hostedOnServerId;
      const effectivePort = input.port !== undefined ? input.port : current.port;

      const existing = await this.databaseRepository.findByNameAndLocation(
        effectiveName,
        effectiveServerId,
        effectivePort,
      );
      if (existing && existing.id !== id) {
        throw new ConflictError(
          `Ja existe um banco de dados chamado '${effectiveName}' neste servidor, nesta porta`,
        );
      }
    }

    const updated = await this.databaseRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Banco de dados', id);
    }

    if ('hostedOnServerId' in input) {
      await this.graphRepository.syncHostRelationship(input.hostedOnServerId ?? null, 'database', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'database.updated',
      resourceType: 'database',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { name: updated.name },
    });

    return updated;
  }

  public async setStatus(id: string, status: string, audit: AuditContext): Promise<Database> {
    await this.getById(id);

    const updated = await this.databaseRepository.setStatus(id, status);
    if (!updated) {
      throw new NotFoundError('Banco de dados', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'database.status_changed',
      resourceType: 'database',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { status },
    });

    return updated;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    await this.getById(id);

    // Check if database is a member of any database group
    const hasGroupMemberships = await this.databaseRepository.hasGroupMemberships(id);
    if (hasGroupMemberships) {
      throw new ConflictError(
        'Nao é possivel remover este banco de dados pois ele esta associado a um agrupador'
      );
    }

    const deleted = await this.databaseRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Banco de dados', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'database.deleted',
      resourceType: 'database',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  }

  public async bulkDelete(ids: string[], audit: AuditContext): Promise<number> {
    const count = await this.databaseRepository.bulkSoftDelete(ids);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'database.bulk_deleted',
      resourceType: 'database',
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { deletedCount: count, ids },
    });

    return count;
  }
}
