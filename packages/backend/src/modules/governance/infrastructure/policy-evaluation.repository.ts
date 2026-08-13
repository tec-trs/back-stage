import type { Knex } from 'knex';

import { PolicyEvaluation, type PolicyEvaluationRow } from '../domain/policy-evaluation.entity.js';

const TABLE_NAME = 'governance_policy_evaluations';

export interface RecordEvaluationInput {
  policyId: string;
  entityId: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface DashboardSummary {
  totalPolicies: number;
  activePolicies: number;
  totalEvaluations: number;
  passCount: number;
  failCount: number;
  warningCount: number;
  openExemptions: number;
}

export interface EvaluableEntity {
  id: string;
  [key: string]: unknown;
}

export interface IPolicyEvaluationRepository {
  record(input: RecordEvaluationInput): Promise<PolicyEvaluation>;
  listForPolicy(
    policyId: string,
    pagination: Pagination,
  ): Promise<{ items: PolicyEvaluation[]; total: number }>;
  listCurrentViolations(
    pagination: Pagination,
  ): Promise<{ items: PolicyEvaluation[]; total: number }>;
  getDashboardSummary(): Promise<DashboardSummary>;
  listEvaluableEntities(): Promise<EvaluableEntity[]>;
  getEvaluableEntity(id: string): Promise<EvaluableEntity | undefined>;
}

export class PolicyEvaluationRepository implements IPolicyEvaluationRepository {
  public constructor(private readonly db: Knex) {}

  public async record(input: RecordEvaluationInput): Promise<PolicyEvaluation> {
    const rows = (await this.db(TABLE_NAME)
      .insert({
        policy_id: input.policyId,
        entity_id: input.entityId,
        status: input.status,
        details: input.details,
      })
      .returning('*')) as PolicyEvaluationRow[];

    return new PolicyEvaluation(rows[0]);
  }

  public async listForPolicy(
    policyId: string,
    pagination: Pagination,
  ): Promise<{ items: PolicyEvaluation[]; total: number }> {
    const query = this.db(TABLE_NAME).where('policy_id', policyId).whereNull('deleted_at');

    const countQuery = query.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = query
      .clone()
      .orderBy('evaluated_at', 'desc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);

    return {
      items: (rows as PolicyEvaluationRow[]).map((row) => new PolicyEvaluation(row)),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  public async listCurrentViolations(
    pagination: Pagination,
  ): Promise<{ items: PolicyEvaluation[]; total: number }> {
    const latestResult = await this.db.raw<{ rows: PolicyEvaluationRow[] }>(`
      SELECT DISTINCT ON (e.policy_id, e.entity_id)
        e.*, p.name as policy_name, c.name as entity_name
      FROM governance_policy_evaluations e
      INNER JOIN governance_policies p ON p.id = e.policy_id
      INNER JOIN catalog_entities c ON c.id = e.entity_id
      WHERE e.deleted_at IS NULL
      ORDER BY e.policy_id, e.entity_id, e.evaluated_at DESC
    `);

    const failingOnly = latestResult.rows.filter((row) => row.status === 'fail');

    const exemptedPairs = (await this.db('governance_policy_exemptions')
      .select('policy_id', 'entity_id')
      .where('status', 'approved')
      .andWhere((builder) => {
        builder.whereNull('expires_at').orWhere('expires_at', '>', this.db.fn.now());
      })) as { policy_id: string; entity_id: string }[];

    const exemptedSet = new Set(exemptedPairs.map((row) => `${row.policy_id}:${row.entity_id}`));

    const violations = failingOnly.filter(
      (row) => !exemptedSet.has(`${row.policy_id}:${row.entity_id}`),
    );

    const total = violations.length;
    const start = (pagination.page - 1) * pagination.pageSize;
    const page = violations.slice(start, start + pagination.pageSize);

    return { items: page.map((row) => new PolicyEvaluation(row)), total };
  }

  public async getDashboardSummary(): Promise<DashboardSummary> {
    const [
      totalPoliciesResult,
      activePoliciesResult,
      evaluationStatusResult,
      openExemptionsResult,
    ] = await Promise.all([
      this.db('governance_policies')
        .whereNull('deleted_at')
        .count<{ count: string }[]>('* as count'),
      this.db('governance_policies')
        .whereNull('deleted_at')
        .where('is_active', true)
        .count<{ count: string }[]>('* as count'),
      this.db(TABLE_NAME)
        .whereNull('deleted_at')
        .select('status')
        .count<{ count: string }[]>('* as count')
        .groupBy('status'),
      this.db('governance_policy_exemptions')
        .whereNull('deleted_at')
        .where('status', 'pending')
        .count<{ count: string }[]>('* as count'),
    ]);

    const statusCounts = new Map(
      (evaluationStatusResult as unknown as { status: string; count: string }[]).map((row) => [
        row.status,
        Number(row.count),
      ]),
    );

    return {
      totalPolicies: Number(totalPoliciesResult[0]?.count ?? 0),
      activePolicies: Number(activePoliciesResult[0]?.count ?? 0),
      totalEvaluations: Array.from(statusCounts.values()).reduce((sum, value) => sum + value, 0),
      passCount: statusCounts.get('pass') ?? 0,
      failCount: statusCounts.get('fail') ?? 0,
      warningCount: statusCounts.get('warning') ?? 0,
      openExemptions: Number(openExemptionsResult[0]?.count ?? 0),
    };
  }

  public async listEvaluableEntities(): Promise<EvaluableEntity[]> {
    const rows = await this.db('catalog_entities').whereNull('deleted_at').select('*');
    return rows as EvaluableEntity[];
  }

  public async getEvaluableEntity(id: string): Promise<EvaluableEntity | undefined> {
    const row = await this.db('catalog_entities').whereNull('deleted_at').where('id', id).first();
    return row as EvaluableEntity | undefined;
  }
}
