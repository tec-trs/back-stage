import { NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type {
  CreateDeploymentInput,
  DeploymentFilters,
  DeploymentRow,
  IDeploymentRepository,
  Pagination,
} from '../infrastructure/deployment.repository.js';

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ListDeploymentsResult {
  items: DeploymentRow[];
  pagination: { page: number; pageSize: number; total: number };
}

export class DeploymentService {
  public constructor(private readonly deploymentRepository: IDeploymentRepository) {}

  public async list(
    filters: DeploymentFilters,
    pagination: Pagination,
  ): Promise<ListDeploymentsResult> {
    const { items, total } = await this.deploymentRepository.findMany(filters, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<DeploymentRow> {
    const deployment = await this.deploymentRepository.findById(id);
    if (!deployment) {
      throw new NotFoundError('Deployment', id);
    }
    return deployment;
  }

  public async create(input: CreateDeploymentInput, audit: AuditContext): Promise<DeploymentRow> {
    const deployment = await this.deploymentRepository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'deployment.started',
      resourceType: 'deployment',
      resourceId: deployment.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: {
        entityId: input.entityId,
        environment: input.environment,
        version: input.version,
      },
    });

    return deployment;
  }
}
