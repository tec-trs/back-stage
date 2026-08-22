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

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

const HEALTH_CHECK_TIMEOUT_MS = 10_000;

async function checkUrlHealth(url: string): Promise<'ok' | 'error' | 'timeout'> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
  try {
    const response = await fetch(url, { method: 'GET', signal: controller.signal });
    return response.ok ? 'ok' : 'error';
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') return 'timeout';
    return 'error';
  } finally {
    clearTimeout(timer);
  }
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

  public async create(input: CreateUrlInput, audit: AuditContext): Promise<Url> {
    if (!isValidUrl(input.url)) {
      throw new ValidationError('Invalid URL format');
    }

    const existing = await this.urlRepository.findByUrl(input.url);
    if (existing) {
      throw new ConflictError(`Ja existe uma URL cadastrada com este endereco`);
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

  public async checkHealth(id: string, audit: AuditContext): Promise<Url> {
    const url = await this.getById(id);

    const healthStatus = await checkUrlHealth(url.url);
    const status = healthStatus === 'ok' ? 'active' : 'error';

    const updated = await this.urlRepository.setStatus(id, status);
    if (!updated) {
      throw new NotFoundError('URL', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'url.health_checked',
      resourceType: 'url',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { healthStatus, status },
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
