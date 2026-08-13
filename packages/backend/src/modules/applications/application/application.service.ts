import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { Application } from '../domain/application.entity.js';
import type {
  ApplicationFilters,
  CreateApplicationInput,
  IApplicationRepository,
  Pagination,
  UpdateApplicationInput,
} from '../infrastructure/application.repository.js';

export interface ListApplicationsResult {
  items: Application[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class ApplicationService {
  public constructor(private readonly applicationRepository: IApplicationRepository) {}

  public async list(
    filters: ApplicationFilters,
    pagination: Pagination,
  ): Promise<ListApplicationsResult> {
    const { items, total } = await this.applicationRepository.findMany(filters, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<Application> {
    const application = await this.applicationRepository.findById(id);
    if (!application) {
      throw new NotFoundError('Aplicacao', id);
    }
    return application;
  }

  public async create(input: CreateApplicationInput, audit: AuditContext): Promise<Application> {
    const existing = await this.applicationRepository.findByCode(input.code);
    if (existing) {
      throw new ConflictError(`Ja existe uma aplicacao com o codigo '${input.code}'`);
    }

    const application = await this.applicationRepository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'application.created',
      resourceType: 'application',
      resourceId: application.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { code: application.code },
    });

    return application;
  }

  public async update(
    id: string,
    input: UpdateApplicationInput,
    audit: AuditContext,
  ): Promise<Application> {
    await this.getById(id);

    if (input.code !== undefined) {
      const existing = await this.applicationRepository.findByCode(input.code);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Ja existe uma aplicacao com o codigo '${input.code}'`);
      }
    }

    const updated = await this.applicationRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Aplicacao', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'application.updated',
      resourceType: 'application',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { changes: input },
    });

    return updated;
  }

  public async setStatus(id: string, status: string, audit: AuditContext): Promise<Application> {
    await this.getById(id);

    const updated = await this.applicationRepository.setStatus(id, status);
    if (!updated) {
      throw new NotFoundError('Aplicacao', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'application.status_changed',
      resourceType: 'application',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { status },
    });

    return updated;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    await this.getById(id);

    const deleted = await this.applicationRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Aplicacao', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'application.deleted',
      resourceType: 'application',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  }
}
