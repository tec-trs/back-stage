import { ConflictError, NotFoundError, ValidationError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { Url } from '../domain/url.entity.js';
import type {
  CreateUrlInput,
  IUrlRepository,
  Pagination,
  UpdateUrlInput,
  UrlFilters,
} from '../infrastructure/url.repository.js';

export interface ListUrlsResult {
  items: Url[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class UrlService {
  public constructor(private readonly urlRepository: IUrlRepository) {}

  public async list(filters: UrlFilters, pagination: Pagination): Promise<ListUrlsResult> {
    const { items, total } = await this.urlRepository.findMany(filters, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<Url> {
    const url = await this.urlRepository.findById(id);
    if (!url) {
      throw new NotFoundError('URL', id);
    }
    return url;
  }

  public async getByOwnerResource(
    ownerResourceType: string,
    ownerResourceId: string,
  ): Promise<Url[]> {
    return this.urlRepository.findByOwnerResource(ownerResourceType, ownerResourceId);
  }

  public async create(input: CreateUrlInput, audit: AuditContext): Promise<Url> {
    const resourceExists = await this.urlRepository.validateOwnerResourceExists(
      input.ownerResourceType,
      input.ownerResourceId,
    );
    if (!resourceExists) {
      throw new ValidationError(
        `Recurso '${input.ownerResourceType}' com id '${input.ownerResourceId}' nao existe`,
      );
    }

    const existing = await this.urlRepository.findByUrl(input.url);
    if (existing && existing.ownerResourceId === input.ownerResourceId) {
      throw new ConflictError(`Ja existe uma URL com este endereco para este recurso`);
    }

    const url = await this.urlRepository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'url.created',
      resourceType: 'url',
      resourceId: url.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { label: url.label, url: url.url },
    });

    return url;
  }

  public async update(id: string, input: UpdateUrlInput, audit: AuditContext): Promise<Url> {
    await this.getById(id);

    if (input.ownerResourceType !== undefined || input.ownerResourceId !== undefined) {
      const ownerType = input.ownerResourceType || (await this.getById(id)).ownerResourceType;
      const ownerId = input.ownerResourceId || (await this.getById(id)).ownerResourceId;

      const resourceExists = await this.urlRepository.validateOwnerResourceExists(ownerType, ownerId);
      if (!resourceExists) {
        throw new ValidationError(`Recurso '${ownerType}' com id '${ownerId}' nao existe`);
      }
    }

    if (input.url !== undefined) {
      const existing = await this.urlRepository.findByUrl(input.url);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Ja existe uma URL com este endereco`);
      }
    }

    const updated = await this.urlRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('URL', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'url.updated',
      resourceType: 'url',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { label: updated.label },
    });

    return updated;
  }

  public async setStatus(id: string, status: string, audit: AuditContext): Promise<Url> {
    await this.getById(id);

    const updated = await this.urlRepository.setStatus(id, status);
    if (!updated) {
      throw new NotFoundError('URL', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'url.status_changed',
      resourceType: 'url',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { status },
    });

    return updated;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    await this.getById(id);

    const deleted = await this.urlRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('URL', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'url.deleted',
      resourceType: 'url',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  }

  public async bulkDelete(ids: string[], audit: AuditContext): Promise<number> {
    const count = await this.urlRepository.bulkSoftDelete(ids);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'url.bulk_deleted',
      resourceType: 'url',
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { count, ids },
    });

    return count;
  }
}
