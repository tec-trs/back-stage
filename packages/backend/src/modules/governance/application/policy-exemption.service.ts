import { ForbiddenError, NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import type { PolicyExemption } from '../domain/policy-exemption.entity.js';
import type {
  CreateExemptionInput,
  IPolicyExemptionRepository,
  Pagination,
} from '../infrastructure/policy-exemption.repository.js';

import type { AuditContext } from './policy.service.js';

export interface ListExemptionsResult {
  items: PolicyExemption[];
  pagination: { page: number; pageSize: number; total: number };
}

export class PolicyExemptionService {
  public constructor(private readonly exemptionRepository: IPolicyExemptionRepository) {}

  public async list(
    status: string | undefined,
    pagination: Pagination,
  ): Promise<ListExemptionsResult> {
    const { items, total } = await this.exemptionRepository.findMany(status, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async request(input: CreateExemptionInput, audit: AuditContext): Promise<PolicyExemption> {
    const exemption = await this.exemptionRepository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'governance.exemption.requested',
      resourceType: 'governance_policy_exemption',
      resourceId: exemption.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { policyId: input.policyId, entityId: input.entityId },
    });

    return exemption;
  }

  public async decide(
    id: string,
    decision: 'approved' | 'rejected',
    approvedByUserId: string,
    audit: AuditContext,
  ): Promise<PolicyExemption> {
    const existing = await this.exemptionRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('PolicyExemption', id);
    }

    if (existing.status !== 'pending') {
      throw new ForbiddenError('Exemption ja foi decidida anteriormente');
    }

    const updated = await this.exemptionRepository.updateStatus(id, decision, approvedByUserId);
    if (!updated) {
      throw new NotFoundError('PolicyExemption', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: `governance.exemption.${decision}`,
      resourceType: 'governance_policy_exemption',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return updated;
  }
}
