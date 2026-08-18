import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { ApplicationType } from '../domain/application-type.entity.js';
import type {
  CreateApplicationTypeData,
  IApplicationTypeRepository,
  UpdateApplicationTypeData,
} from '../infrastructure/application-type.repository.js';

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class ApplicationTypeService {
  public constructor(private readonly repository: IApplicationTypeRepository) {}

  public async list(): Promise<ApplicationType[]> {
    return this.repository.findAll();
  }

  public async getById(id: string): Promise<ApplicationType> {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Tipo de Aplicacao', id);
    return item;
  }

  public async create(input: CreateApplicationTypeData, audit: AuditContext): Promise<ApplicationType> {
    const existing = await this.repository.findBySlug(input.slug);
    if (existing) throw new ConflictError(`Ja existe um tipo de aplicacao com o slug '${input.slug}'`);

    const item = await this.repository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'application_type.created',
      resourceType: 'application_type',
      resourceId: item.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: item.slug, name: item.name },
    });

    return item;
  }

  public async update(id: string, input: UpdateApplicationTypeData, audit: AuditContext): Promise<ApplicationType> {
    const existing = await this.getById(id);

    const item = await this.repository.update(id, input);
    if (!item) throw new NotFoundError('Tipo de Aplicacao', id);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'application_type.updated',
      resourceType: 'application_type',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: existing.slug, name: item.name },
    });

    return item;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    const item = await this.getById(id);

    await this.repository.delete(id);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'application_type.deleted',
      resourceType: 'application_type',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: item.slug, name: item.name },
    });
  }

  public async bulkDelete(ids: string[], audit: AuditContext): Promise<number> {
    const count = await this.repository.bulkSoftDelete(ids);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'application_type.bulk_deleted',
      resourceType: 'application_type',
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { count, ids },
    });

    return count;
  }
}
