import type { Knex } from 'knex';

import { Policy, type PolicyRow } from '../domain/policy.entity.js';

const TABLE_NAME = 'governance_policies';

export interface PolicyFilters {
  policyType?: string;
  isActive?: boolean;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface CreatePolicyInput {
  name: string;
  slug: string;
  description?: string | null;
  policyType: string;
  definition: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export type UpdatePolicyInput = Partial<CreatePolicyInput>;

export interface IPolicyRepository {
  findMany(
    filters: PolicyFilters,
    pagination: Pagination,
  ): Promise<{ items: Policy[]; total: number }>;
  findById(id: string): Promise<Policy | undefined>;
  findBySlug(slug: string): Promise<Policy | undefined>;
  findActive(): Promise<Policy[]>;
  create(input: CreatePolicyInput): Promise<Policy>;
  update(id: string, input: UpdatePolicyInput): Promise<Policy | undefined>;
  softDelete(id: string): Promise<boolean>;
}

export class PolicyRepository implements IPolicyRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME).whereNull('deleted_at');
  }

  public async findMany(
    filters: PolicyFilters,
    pagination: Pagination,
  ): Promise<{ items: Policy[]; total: number }> {
    const query = this.baseQuery();
    if (filters.policyType) query.where('policy_type', filters.policyType);
    if (filters.isActive !== undefined) query.where('is_active', filters.isActive);

    const countQuery = query.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = query
      .clone()
      .orderBy('name', 'asc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);

    return {
      items: (rows as PolicyRow[]).map((row) => new Policy(row)),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  public async findById(id: string): Promise<Policy | undefined> {
    const row = (await this.baseQuery().where('id', id).first()) as PolicyRow | undefined;
    return row ? new Policy(row) : undefined;
  }

  public async findBySlug(slug: string): Promise<Policy | undefined> {
    const row = (await this.baseQuery().where('slug', slug).first()) as PolicyRow | undefined;
    return row ? new Policy(row) : undefined;
  }

  public async findActive(): Promise<Policy[]> {
    const rows = (await this.baseQuery().where('is_active', true)) as PolicyRow[];
    return rows.map((row) => new Policy(row));
  }

  public async create(input: CreatePolicyInput): Promise<Policy> {
    const rows = (await this.db(TABLE_NAME)
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        policy_type: input.policyType,
        definition: input.definition,
        is_active: input.isActive ?? true,
        metadata: JSON.stringify(input.metadata ?? {}),
      })
      .returning('*')) as PolicyRow[];

    return new Policy(rows[0]);
  }

  public async update(id: string, input: UpdatePolicyInput): Promise<Policy | undefined> {
    const patch: Record<string, unknown> = {};

    if (input.name !== undefined) patch.name = input.name;
    if (input.slug !== undefined) patch.slug = input.slug;
    if (input.description !== undefined) patch.description = input.description;
    if (input.policyType !== undefined) patch.policy_type = input.policyType;
    if (input.definition !== undefined) patch.definition = input.definition;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    if (input.metadata !== undefined) patch.metadata = JSON.stringify(input.metadata);

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const rows = (await this.baseQuery()
      .where('id', id)
      .update(patch)
      .returning('*')) as PolicyRow[];

    return rows[0] ? new Policy(rows[0]) : undefined;
  }

  public async softDelete(id: string): Promise<boolean> {
    const affected = (await this.baseQuery()
      .where('id', id)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected > 0;
  }
}
