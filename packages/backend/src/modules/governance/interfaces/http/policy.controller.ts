import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { PolicyEvaluationService } from '../../application/policy-evaluation.service.js';
import type { PolicyExemptionService } from '../../application/policy-exemption.service.js';
import type { AuditContext, PolicyService } from '../../application/policy.service.js';

import type {
  createExemptionBodySchema,
  createPolicyBodySchema,
  listExemptionsQuerySchema,
  listPoliciesQuerySchema,
  paginationQuerySchema,
  updatePolicyBodySchema,
} from './policy.validation.js';

type CreatePolicyBody = z.infer<typeof createPolicyBodySchema>;
type UpdatePolicyBody = z.infer<typeof updatePolicyBodySchema>;
type ListPoliciesQuery = z.infer<typeof listPoliciesQuerySchema>;
type PaginationQuery = z.infer<typeof paginationQuerySchema>;
type CreateExemptionBody = z.infer<typeof createExemptionBodySchema>;
type ListExemptionsQuery = z.infer<typeof listExemptionsQuerySchema>;

function auditContextFrom(request: Request): AuditContext {
  return {
    actorUserId: request.user?.id,
    ipAddress: request.ip,
    userAgent: request.header('user-agent'),
  };
}

export class PolicyController {
  public constructor(
    private readonly policyService: PolicyService,
    private readonly evaluationService: PolicyEvaluationService,
    private readonly exemptionService: PolicyExemptionService,
  ) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListPoliciesQuery;
    const result = await this.policyService.list(
      { policyType: query.policyType, isActive: query.isActive },
      { page: query.page, pageSize: query.pageSize },
    );
    response
      .status(200)
      .json({ items: result.items.map((item) => item.toJSON()), pagination: result.pagination });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const policy = await this.policyService.getById(request.params.id);
    response.status(200).json(policy.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreatePolicyBody;
    const policy = await this.policyService.create(body, auditContextFrom(request));
    response.status(201).json(policy.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdatePolicyBody;
    const policy = await this.policyService.update(
      request.params.id,
      body,
      auditContextFrom(request),
    );
    response.status(200).json(policy.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.policyService.delete(request.params.id, auditContextFrom(request));
    response.status(204).send();
  };

  public evaluate = async (request: Request, response: Response): Promise<void> => {
    const result = await this.evaluationService.evaluatePolicy(
      request.params.id,
      auditContextFrom(request),
    );
    response.status(200).json(result);
  };

  public evaluateEntity = async (request: Request, response: Response): Promise<void> => {
    const evaluation = await this.evaluationService.evaluateEntity(
      request.params.id,
      request.params.entityId,
      auditContextFrom(request),
    );
    response.status(200).json(evaluation.toJSON());
  };

  public listEvaluations = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as PaginationQuery;
    const result = await this.evaluationService.listForPolicy(request.params.id, {
      page: query.page,
      pageSize: query.pageSize,
    });
    response
      .status(200)
      .json({ items: result.items.map((item) => item.toJSON()), pagination: result.pagination });
  };

  public listViolations = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as PaginationQuery;
    const result = await this.evaluationService.listViolations({
      page: query.page,
      pageSize: query.pageSize,
    });
    response
      .status(200)
      .json({ items: result.items.map((item) => item.toJSON()), pagination: result.pagination });
  };

  public getDashboard = async (_request: Request, response: Response): Promise<void> => {
    const summary = await this.evaluationService.getDashboard();
    response.status(200).json(summary);
  };

  public listExemptions = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListExemptionsQuery;
    const result = await this.exemptionService.list(query.status, {
      page: query.page,
      pageSize: query.pageSize,
    });
    response
      .status(200)
      .json({ items: result.items.map((item) => item.toJSON()), pagination: result.pagination });
  };

  public requestExemption = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateExemptionBody;
    const exemption = await this.exemptionService.request(
      {
        policyId: body.policyId,
        entityId: body.entityId,
        reason: body.reason,
        requestedByUserId: request.user?.id ?? null,
        expiresAt: body.expiresAt ?? null,
      },
      auditContextFrom(request),
    );
    response.status(201).json(exemption.toJSON());
  };

  public approveExemption = async (request: Request, response: Response): Promise<void> => {
    const exemption = await this.exemptionService.decide(
      request.params.id,
      'approved',
      request.user!.id,
      auditContextFrom(request),
    );
    response.status(200).json(exemption.toJSON());
  };

  public rejectExemption = async (request: Request, response: Response): Promise<void> => {
    const exemption = await this.exemptionService.decide(
      request.params.id,
      'rejected',
      request.user!.id,
      auditContextFrom(request),
    );
    response.status(200).json(exemption.toJSON());
  };
}
