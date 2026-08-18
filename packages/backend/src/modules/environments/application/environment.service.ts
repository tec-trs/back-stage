import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { Environment } from '../domain/environment.entity.js';
import type {
  CreateEnvironmentInput,
  IEnvironmentRepository,
  UpdateEnvironmentInput,
} from '../infrastructure/environment.repository.js';

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class EnvironmentService {
  public constructor(private readonly environmentRepository: IEnvironmentRepository) {}

  public async list(): Promise<Environment[]> {
    return this.environmentRepository.findAll();
  }

  public async getById(id: string): Promise<Environment> {
    const env = await this.environmentRepository.findById(id);
    if (!env) throw new NotFoundError('Ambiente', id);
    return env;
  }

  public async create(input: CreateEnvironmentInput, audit: AuditContext): Promise<Environment> {
    const existing = await this.environmentRepository.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Ja existe um ambiente com o slug '${input.slug}'`);
    }

    const env = await this.environmentRepository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'environment.created',
      resourceType: 'environment',
      resourceId: env.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: env.slug, name: env.name },
    });

    return env;
  }

  public async update(id: string, input: UpdateEnvironmentInput, audit: AuditContext): Promise<Environment> {
    await this.getById(id);

    const env = await this.environmentRepository.update(id, input);
    if (!env) throw new NotFoundError('Ambiente', id);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'environment.updated',
      resourceType: 'environment',
      resourceId: env.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: env.slug, name: env.name },
    });

    return env;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    const env = await this.getById(id);

    await this.environmentRepository.delete(id);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'environment.deleted',
      resourceType: 'environment',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { slug: env.slug, name: env.name },
    });
  }

  public async bulkDelete(ids: string[], audit: AuditContext): Promise<number> {
    const count = await this.environmentRepository.bulkSoftDelete(ids);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'environment.bulk_deleted',
      resourceType: 'environment',
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { count, ids },
    });

    return count;
  }
}
