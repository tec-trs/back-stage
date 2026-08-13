import type { Knex } from 'knex';

const TABLE_NAME = 'catalog_entities';

export interface CatalogEntityRow {
  id: string;
  kind: string;
  type: string;
  name: string;
  namespace: string;
  title: string | null;
  description: string | null;
  lifecycle: string;
  owner_team_id: string | null;
  system_id: string | null;
  repository_url: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CatalogEntityFilters {
  kind?: string;
  lifecycle?: string;
  namespace?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface ICatalogEntityRepository {
  findMany(
    filters: CatalogEntityFilters,
    pagination: Pagination,
  ): Promise<{ items: CatalogEntityRow[]; total: number }>;
  findById(id: string): Promise<CatalogEntityRow | undefined>;
}

export class CatalogEntityRepository implements ICatalogEntityRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME).whereNull('deleted_at');
  }

  public async findMany(
    filters: CatalogEntityFilters,
    pagination: Pagination,
  ): Promise<{ items: CatalogEntityRow[]; total: number }> {
    const query = this.baseQuery();
    if (filters.kind) query.where('kind', filters.kind);
    if (filters.lifecycle) query.where('lifecycle', filters.lifecycle);
    if (filters.namespace) query.where('namespace', filters.namespace);

    const countQuery = query.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = query
      .clone()
      .orderBy('name', 'asc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);
    return {
      items: rows as CatalogEntityRow[],
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  public async findById(id: string): Promise<CatalogEntityRow | undefined> {
    const row = await this.baseQuery().where('id', id).first();
    return row as CatalogEntityRow | undefined;
  }
}
