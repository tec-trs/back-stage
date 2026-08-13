import { ConflictError, NotFoundError, ValidationError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import { parsePolicyDefinition } from '../domain/policy-definition.js';
import type { Policy } from '../domain/policy.entity.js';
import type {
  CreatePolicyInput,
  IPolicyRepository,
  Pagination,
  PolicyFilters,
  UpdatePolicyInput,
} from '../infrastructure/policy.repository.js';

export interface AuditContext {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ListPoliciesResult {
  items: Policy[];
  pagination: { page: number; pageSize: number; total: number };
}

function definitionError(error: unknown): ValidationError {
  const message = error instanceof Error ? error.message : 'Definicao de policy invalida';
  return new ValidationError(message, { definition: [message] });
}

export class PolicyService {
  public constructor(private readonly policyRepository: IPolicyRepository) {}

  public async list(filters: PolicyFilters, pagination: Pagination): Promise<ListPoliciesResult> {
    const { items, total } = await this.policyRepository.findMany(filters, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getById(id: string): Promise<Policy> {
    const policy = await this.policyRepository.findById(id);
    if (!policy) {
      throw new NotFoundError('Policy', id);
    }
    return policy;
  }

  public async create(input: CreatePolicyInput, audit: AuditContext): Promise<Policy> {
    try {
      parsePolicyDefinition(input.definition);
    } catch (error) {
      throw definitionError(error);
    }

    const existing = await this.policyRepository.findBySlug(input.slug);
    if (existing) {
      throw new ConflictError(`Ja existe uma policy com o slug '${input.slug}'`);
    }

    const policy = await this.policyRepository.create(input);

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'governance.policy.created',
      resourceType: 'governance_policy',
      resourceId: policy.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { name: policy.name, slug: policy.slug },
    });

    return policy;
  }

  public async update(id: string, input: UpdatePolicyInput, audit: AuditContext): Promise<Policy> {
    await this.getById(id);

    if (input.definition !== undefined) {
      try {
        parsePolicyDefinition(input.definition);
      } catch (error) {
        throw definitionError(error);
      }
    }

    const updated = await this.policyRepository.update(id, input);
    if (!updated) {
      throw new NotFoundError('Policy', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'governance.policy.updated',
      resourceType: 'governance_policy',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { changes: input },
    });

    return updated;
  }

  public async delete(id: string, audit: AuditContext): Promise<void> {
    await this.getById(id);

    const deleted = await this.policyRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError('Policy', id);
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'governance.policy.deleted',
      resourceType: 'governance_policy',
      resourceId: id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });
  }
}
