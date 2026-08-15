import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { ServerType } from '../domain/server-type.entity.js';
import type {
  CreateServerTypeData,
  IServerTypeRepository,
  UpdateServerTypeData,
} from '../infrastructure/server-type.repository.js';

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class ServerTypeService {
  public constructor(private readonly repository: IServerTypeRepository) {}

  public async list(): Promise<ServerType[]> {
    return this.repository.findAll();
  }

  public async getById(id: string): Promise<ServerType> {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundError('Tipo de Maquina', id);
    return item;
  }

  public async create(input: CreateServerTypeData, audit: AuditContext): Promise<ServerType> {
    const existing = await this.repository.findBySlug(input.slug);
    if (existing) throw new ConflictError(`Ja existe um tipo de maquina com o slug '${input.slug}'`);

    const item = await this.repository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'server_type.created',
      resourceType: 'server_type',
      resourceId: item.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: item.slug, name: item.name },
    });

    return item;
  }

  public async update(id: string, input: UpdateServerTypeData, audit: AuditContext): Promise<ServerType> {
    const existing = await this.getById(id);

    const item = await this.repository.update(id, input);
    if (!item) throw new NotFoundError('Tipo de Maquina', id);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'server_type.updated',
      resourceType: 'server_type',
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
      action: 'server_type.deleted',
      resourceType: 'server_type',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: item.slug, name: item.name },
    });
  }
}
