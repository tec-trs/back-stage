import { NotFoundError } from '@back-stage/shared';

import { auditLogger } from '../../../shared/audit/audit-logger.js';
import { parsePolicyDefinition } from '../domain/policy-definition.js';
import { PolicyEngine } from '../domain/policy-engine.js';
import type { PolicyEvaluation } from '../domain/policy-evaluation.entity.js';
import type {
  DashboardSummary,
  IPolicyEvaluationRepository,
  Pagination,
} from '../infrastructure/policy-evaluation.repository.js';
import type { IPolicyRepository } from '../infrastructure/policy.repository.js';

import type { AuditContext } from './policy.service.js';

export interface EvaluatePolicyResult {
  policyId: string;
  evaluated: number;
  passed: number;
  failed: number;
}

export interface ListEvaluationsResult {
  items: PolicyEvaluation[];
  pagination: { page: number; pageSize: number; total: number };
}

export class PolicyEvaluationService {
  private readonly engine = new PolicyEngine();

  public constructor(
    private readonly policyRepository: IPolicyRepository,
    private readonly evaluationRepository: IPolicyEvaluationRepository,
  ) {}

  public async evaluatePolicy(
    policyId: string,
    audit: AuditContext,
  ): Promise<EvaluatePolicyResult> {
    const policy = await this.policyRepository.findById(policyId);
    if (!policy) {
      throw new NotFoundError('Policy', policyId);
    }

    const definition = parsePolicyDefinition(policy.definition);
    const entities = await this.evaluationRepository.listEvaluableEntities();

    let passed = 0;
    let failed = 0;

    for (const entity of entities) {
      const result = this.engine.evaluate(entity, definition);
      if (result.status === 'pass') {
        passed += 1;
      } else {
        failed += 1;
      }

      await this.evaluationRepository.record({
        policyId: policy.id,
        entityId: entity.id,
        status: result.status,
        details: JSON.stringify(result.details),
      });
    }

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'governance.policy.evaluated',
      resourceType: 'governance_policy',
      resourceId: policy.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { evaluated: entities.length, passed, failed },
    });

    return { policyId: policy.id, evaluated: entities.length, passed, failed };
  }

  public async evaluateEntity(
    policyId: string,
    entityId: string,
    audit: AuditContext,
  ): Promise<PolicyEvaluation> {
    const policy = await this.policyRepository.findById(policyId);
    if (!policy) {
      throw new NotFoundError('Policy', policyId);
    }

    const entity = await this.evaluationRepository.getEvaluableEntity(entityId);
    if (!entity) {
      throw new NotFoundError('CatalogEntity', entityId);
    }

    const definition = parsePolicyDefinition(policy.definition);
    const result = this.engine.evaluate(entity, definition);

    const evaluation = await this.evaluationRepository.record({
      policyId: policy.id,
      entityId: entity.id,
      status: result.status,
      details: JSON.stringify(result.details),
    });

    await auditLogger.record({
      actorUserId: audit.actorUserId,
      action: 'governance.policy.evaluated',
      resourceType: 'governance_policy',
      resourceId: policy.id,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
      metadata: { entityId, status: result.status },
    });

    return evaluation;
  }

  public async listForPolicy(
    policyId: string,
    pagination: Pagination,
  ): Promise<ListEvaluationsResult> {
    const { items, total } = await this.evaluationRepository.listForPolicy(policyId, pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async listViolations(pagination: Pagination): Promise<ListEvaluationsResult> {
    const { items, total } = await this.evaluationRepository.listCurrentViolations(pagination);
    return { items, pagination: { ...pagination, total } };
  }

  public async getDashboard(): Promise<DashboardSummary> {
    return this.evaluationRepository.getDashboardSummary();
  }
}
