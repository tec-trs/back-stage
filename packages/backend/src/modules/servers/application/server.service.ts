import { ConflictError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { Server } from '../domain/server.entity.js';
import type {
  CreateServerInput,
  IServerRepository,
  Pagination,
  ServerFilters,
  UpdateServerInput,
} from '../infrastructure/server.repository.js';
import type { ResourceRelationshipRepository } from '../../resource-graph/infrastructure/resource-relationship.repository.js';

export interface ListServersResult {
  items: Server[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class ServerService {
  public constructor(
    private readonly serverRepository: IServerRepository,
    private readonly resourceRelationshipRepository?: ResourceRelationshipRepository,
  ) {}

  public async list(filters: ServerFilters, pagination: Pagination): Promise<ListServersResult> {
    const { items, total } = await this.serverRepository.findMany(filters, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<Server> {
    const server = await this.serverRepository.findById(id);
    if (!server) {
      throw new NotFoundError('Servidor', id);
    }
    return server;
  }

  public async create(input: CreateServerInput, audit: AuditContext): Promise<Server> {
    const existing = await this.serverRepository.findByHostname(input.hostname);
    if (existing) {
      throw new ConflictError(`Ja existe um servidor com o hostname '${input.hostname}'`);
    }

    const server = await this.serverRepository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'server.created',
      resourceType: 'server',
      resourceId: server.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { hostname: server.hostname },
    });

    return server;
  }

  public async update(id: string, input: UpdateServerInput, audit: AuditContext): Promise<Server> {
    await this.getById(id);

    if (input.hostname !== undefined) {
      const existing = await this.serverRepository.findByHostname(input.hostname);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Ja existe um servidor com o hostname '${input.hostname}'`);
      }
    }

    const updated = await this.serverRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Servidor', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'server.updated',
      resourceType: 'server',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { changes: input },
    });

    return updated;
  }

  public async setStatus(id: string, status: string, audit: AuditContext): Promise<Server> {
    await this.getById(id);

    const updated = await this.serverRepository.setStatus(id, status);
    if (!updated) {
      throw new NotFoundError('Servidor', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'server.status_changed',
      resourceType: 'server',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { status },
    });

    return updated;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    await this.getById(id);

    const hasApps = await this.serverRepository.hasLinkedApplications(id);
    if (hasApps) {
      throw new ConflictError(
        'Nao e possivel eliminar o servidor pois existem aplicacoes implantadas nele. Remova as implantacoes antes de eliminar o servidor.',
      );
    }

    const deleted = await this.serverRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Servidor', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'server.deleted',
      resourceType: 'server',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  }

  public async bulkDelete(ids: string[], audit: AuditContext): Promise<number> {
    const blocked = await this.serverRepository.serversWithLinkedApplications(ids);
    if (blocked.length > 0) {
      throw new ConflictError(
        `${blocked.length} servidor(es) nao podem ser eliminados pois possuem aplicacoes implantadas. Remova as implantacoes antes de eliminar.`,
      );
    }

    const count = await this.serverRepository.bulkSoftDelete(ids);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'server.bulk_deleted',
      resourceType: 'server',
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { count, ids },
    });

    return count;
  }

  public async duplicateWithRelationships(
    sourceServerId: string,
    input: CreateServerInput,
    audit: AuditContext,
  ): Promise<Server> {
    // Validate that the source server exists
    await this.getById(sourceServerId);

    // Create the new server
    const newServer = await this.create(input, audit);

    // If resource relationship repository is available, copy 'hosts' relationships
    if (this.resourceRelationshipRepository) {
      try {
        const hostRelationships = await this.resourceRelationshipRepository.listRelationships({
          sourceType: 'server',
          sourceId: sourceServerId,
          relationType: 'hosts',
        });

        // Create new relationships pointing from the new server to the same targets
        for (const rel of hostRelationships) {
          await this.resourceRelationshipRepository.createRelationship(
            'server', // sourceType
            newServer.id, // sourceId
            rel.targetType, // targetType
            rel.targetId, // targetId
            'hosts',
            rel.metadata,
            rel.reason ?? undefined,
          );
        }

        await auditLogger.record({
          actorUserId: audit.actorUserId,
          action: 'server.duplicated_with_relations',
          resourceType: 'server',
          resourceId: newServer.id,
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
          metadata: { sourceServerId, relationshipCount: hostRelationships.length },
        });
      } catch (err) {
        // Log error but don't fail the server creation
        console.error('Failed to copy relationships when duplicating server:', err);
      }
    }

    return newServer;
  }
}
