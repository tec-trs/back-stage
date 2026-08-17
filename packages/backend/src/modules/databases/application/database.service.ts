import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
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

export class DatabaseService {
  public constructor(private readonly databaseRepository: IDatabaseRepository) {}

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
    const existing = await this.databaseRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError(`Ja existe um banco de dados com o nome '${input.name}'`);
    }

    const database = await this.databaseRepository.create(input);

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
    await this.getById(id);

    if (input.name !== undefined) {
      const existing = await this.databaseRepository.findByName(input.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Ja existe um banco de dados com o nome '${input.name}'`);
      }
    }

    const updated = await this.databaseRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Banco de dados', id);
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
}
