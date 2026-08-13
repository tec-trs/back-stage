import type { Knex } from 'knex';

import { PolicyExemption, type PolicyExemptionRow } from '../domain/policy-exemption.entity.js';

const TABLE_NAME = 'governance_policy_exemptions';

export interface CreateExemptionInput {
  policyId: string;
  entityId: string;
  reason: string;
  requestedByUserId?: string | null;
  expiresAt?: Date | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface IPolicyExemptionRepository {
  findMany(
    status: string | undefined,
    pagination: Pagination,
  ): Promise<{ items: PolicyExemption[]; total: number }>;
  findById(id: string): Promise<PolicyExemption | undefined>;
  create(input: CreateExemptionInput): Promise<PolicyExemption>;
  updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    approvedByUserId: string,
  ): Promise<PolicyExemption | undefined>;
}

export class PolicyExemptionRepository implements IPolicyExemptionRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME).whereNull('deleted_at');
  }

  public async findMany(
    status: string | undefined,
    pagination: Pagination,
  ): Promise<{ items: PolicyExemption[]; total: number }> {
    const query = this.baseQuery();
    if (status) query.where('status', status);

    const countQuery = query.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = query
      .clone()
      .orderBy('created_at', 'desc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);

    return {
      items: (rows as PolicyExemptionRow[]).map((row) => new PolicyExemption(row)),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  public async findById(id: string): Promise<PolicyExemption | undefined> {
    const row = (await this.baseQuery().where('id', id).first()) as PolicyExemptionRow | undefined;
    return row ? new PolicyExemption(row) : undefined;
  }

  public async create(input: CreateExemptionInput): Promise<PolicyExemption> {
    const rows = (await this.db(TABLE_NAME)
      .insert({
        policy_id: input.policyId,
        entity_id: input.entityId,
        reason: input.reason,
        requested_by_user_id: input.requestedByUserId ?? null,
        expires_at: input.expiresAt ?? null,
        status: 'pending',
      })
      .returning('*')) as PolicyExemptionRow[];

    return new PolicyExemption(rows[0]);
  }

  public async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    approvedByUserId: string,
  ): Promise<PolicyExemption | undefined> {
    const rows = (await this.baseQuery()
      .where('id', id)
      .update({ status, approved_by_user_id: approvedByUserId })
      .returning('*')) as PolicyExemptionRow[];

    return rows[0] ? new PolicyExemption(rows[0]) : undefined;
  }
}
