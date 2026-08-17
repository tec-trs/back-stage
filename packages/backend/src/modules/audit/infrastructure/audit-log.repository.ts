import type { Knex } from 'knex';

const TABLE_NAME = 'audit_logs';

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface AuditLogFilters {
  action?: string;
  resourceType?: string;
  resourceId?: string;
  actorUserId?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface IAuditLogRepository {
  findMany(
    filters: AuditLogFilters,
    pagination: Pagination,
  ): Promise<{ items: AuditLogRow[]; total: number }>;
  deleteByIds(ids: string[]): Promise<number>;
}

export class AuditLogRepository implements IAuditLogRepository {
  public constructor(private readonly db: Knex) {}

  public async findMany(
    filters: AuditLogFilters,
    pagination: Pagination,
  ): Promise<{ items: AuditLogRow[]; total: number }> {
    const query = this.db(TABLE_NAME);
    if (filters.action) query.where('action', filters.action);
    if (filters.resourceType) query.where('resource_type', filters.resourceType);
    if (filters.resourceId) query.where('resource_id', filters.resourceId);
    if (filters.actorUserId) query.where('actor_user_id', filters.actorUserId);

    const countQuery = query.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = query
      .clone()
      .orderBy('created_at', 'desc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);
    return {
      items: rows as AuditLogRow[],
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  public async deleteByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const affected = (await this.db(TABLE_NAME).whereIn('id', ids).del()) as unknown as number;
    return affected;
  }
}
