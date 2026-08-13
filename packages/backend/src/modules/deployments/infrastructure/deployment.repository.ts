import type { Knex } from 'knex';

const TABLE_NAME = 'deployments';

export interface DeploymentRow {
  id: string;
  entity_id: string;
  environment: string;
  version: string;
  status: string;
  triggered_by_user_id: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface DeploymentFilters {
  entityId?: string;
  environment?: string;
  status?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface CreateDeploymentInput {
  entityId: string;
  environment: string;
  version: string;
  status: string;
  triggeredByUserId?: string | null;
  startedAt?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface UpdateDeploymentStatusInput {
  status: string;
  finishedAt?: Date | null;
  metadata?: Record<string, unknown>;
}

export interface IDeploymentRepository {
  findMany(
    filters: DeploymentFilters,
    pagination: Pagination,
  ): Promise<{ items: DeploymentRow[]; total: number }>;
  findById(id: string): Promise<DeploymentRow | undefined>;
  findByExternalId(externalId: string): Promise<DeploymentRow | undefined>;
  create(input: CreateDeploymentInput): Promise<DeploymentRow>;
  updateStatus(id: string, input: UpdateDeploymentStatusInput): Promise<DeploymentRow | undefined>;
}

export class DeploymentRepository implements IDeploymentRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME).whereNull('deleted_at');
  }

  public async findMany(
    filters: DeploymentFilters,
    pagination: Pagination,
  ): Promise<{ items: DeploymentRow[]; total: number }> {
    const query = this.baseQuery();
    if (filters.entityId) query.where('entity_id', filters.entityId);
    if (filters.environment) query.where('environment', filters.environment);
    if (filters.status) query.where('status', filters.status);

    const countQuery = query.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = query
      .clone()
      .orderBy('created_at', 'desc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);
    return {
      items: rows as DeploymentRow[],
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  public async findById(id: string): Promise<DeploymentRow | undefined> {
    const row = await this.baseQuery().where('id', id).first();
    return row as DeploymentRow | undefined;
  }

  public async findByExternalId(externalId: string): Promise<DeploymentRow | undefined> {
    const row = await this.baseQuery()
      .whereRaw("metadata->>'externalId' = ?", [externalId])
      .first();
    return row as DeploymentRow | undefined;
  }

  public async create(input: CreateDeploymentInput): Promise<DeploymentRow> {
    const rows = await this.db(TABLE_NAME)
      .insert({
        entity_id: input.entityId,
        environment: input.environment,
        version: input.version,
        status: input.status,
        triggered_by_user_id: input.triggeredByUserId ?? null,
        started_at: input.startedAt ?? null,
        metadata: JSON.stringify(input.metadata ?? {}),
      })
      .returning('*');
    return (rows as DeploymentRow[])[0];
  }

  public async updateStatus(
    id: string,
    input: UpdateDeploymentStatusInput,
  ): Promise<DeploymentRow | undefined> {
    const patch: Record<string, unknown> = { status: input.status };
    if (input.finishedAt !== undefined) patch.finished_at = input.finishedAt;
    if (input.metadata !== undefined) patch.metadata = JSON.stringify(input.metadata);

    const rows = await this.baseQuery().where('id', id).update(patch).returning('*');
    return (rows as DeploymentRow[])[0];
  }
}
