import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { Service } from '../domain/service.entity.js';
import type {
  CreateServiceInput,
  IServiceRepository,
  Pagination,
  ServiceFilters,
  ServiceSort,
  UpdateServiceInput,
} from '../infrastructure/service.repository.js';

export interface ListServicesResult {
  items: Service[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class ServiceService {
  public constructor(private readonly serviceRepository: IServiceRepository) {}

  public async list(
    filters: ServiceFilters,
    sort: ServiceSort,
    pagination: Pagination,
  ): Promise<ListServicesResult> {
    const { items, total } = await this.serviceRepository.findMany(filters, sort, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<Service> {
    const service = await this.serviceRepository.findById(id);
    if (!service) {
      throw new NotFoundError('Service', id);
    }
    return service;
  }

  public async search(query: string, limit = 20): Promise<Service[]> {
    return this.serviceRepository.search(query, limit);
  }

  public async create(input: CreateServiceInput, audit: AuditContext): Promise<Service> {
    const existing = await this.serviceRepository.findByNamespaceAndName(
      input.namespace,
      input.name,
    );
    if (existing) {
      throw new ConflictError(
        `Ja existe um service '${input.name}' no namespace '${input.namespace}'`,
      );
    }

    const service = await this.serviceRepository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'service.created',
      resourceType: 'catalog_entity',
      resourceId: service.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { name: service.name, namespace: service.namespace },
    });

    return service;
  }

  public async update(
    id: string,
    input: UpdateServiceInput,
    audit: AuditContext,
  ): Promise<Service> {
    await this.getById(id);

    const updated = await this.serviceRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Service', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'service.updated',
      resourceType: 'catalog_entity',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { changes: input },
    });

    return updated;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    await this.getById(id);

    const deleted = await this.serviceRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Service', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'service.deleted',
      resourceType: 'catalog_entity',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  }
}
