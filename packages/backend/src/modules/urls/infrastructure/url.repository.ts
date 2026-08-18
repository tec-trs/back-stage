import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';
import { Url, type UrlRow } from '../domain/url.entity.js';

const TABLE_NAME = 'urls';

export interface UrlFilters {
  status?: string;
  urlType?: string;
  tags?: string[];
  search?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface CreateUrlInput {
  label: string;
  url: string;
  urlType: string;
  description?: string | null;
  method?: string | null;
  authRequired?: boolean;
  authMethod?: string | null;
  status?: string;
  healthcheckEnabled?: boolean;
  lastCheckStatus?: string | null;
  lastCheckedAt?: Date | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export type UpdateUrlInput = Partial<CreateUrlInput>;

export interface IUrlRepository {
  findMany(filters: UrlFilters, pagination: Pagination): Promise<{ items: Url[]; total: number }>;
  findById(id: string): Promise<Url | undefined>;
  findByUrl(url: string): Promise<Url | undefined>;
  create(input: CreateUrlInput): Promise<Url>;
  update(id: string, input: UpdateUrlInput): Promise<Url | undefined>;
  setStatus(id: string, status: string): Promise<Url | undefined>;
  softDelete(id: string): Promise<boolean>;
  bulkSoftDelete(ids: string[]): Promise<number>;
}

export class UrlRepository implements IUrlRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at');
  }

  public async findMany(filters: UrlFilters, pagination: Pagination): Promise<{ items: Url[]; total: number }> {
    const orgId = orgContext.getOrThrow();
    const filteredQuery = this.db(TABLE_NAME).where('organization_id', orgId).whereNull('deleted_at');

    if (filters.status) {
      filteredQuery.where('status', filters.status);
    }
    if (filters.urlType) {
      filteredQuery.where('url_type', filters.urlType);
    }
    if (filters.tags && filters.tags.length > 0) {
      filteredQuery.where((builder) => {
        builder.whereRaw('tags && ?', [filters.tags as string[]]);
      });
    }
    if (filters.search) {
      filteredQuery.where((builder) => {
        builder.whereILike('label', `%${filters.search}%`).orWhereILike('url', `%${filters.search}%`);
      });
    }

    const countQuery = filteredQuery.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = filteredQuery
      .clone()
      .orderBy('label', 'asc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);
    const items = rows.map((row: UrlRow) => new Url(row as UrlRow));

    return { items, total: Number(countResult[0]?.count ?? 0) };
  }

  public async findById(id: string): Promise<Url | undefined> {
    const row = (await this.baseQuery().where('id', id).first()) as UrlRow | undefined;
    if (!row) {
      return undefined;
    }
    return new Url(row);
  }

  public async findByUrl(url: string): Promise<Url | undefined> {
    const row = (await this.baseQuery().where('url', url).first()) as UrlRow | undefined;
    if (!row) {
      return undefined;
    }
    return new Url(row);
  }

  public async create(input: CreateUrlInput): Promise<Url> {
    const [row] = (await this.db(TABLE_NAME)
      .insert({
        organization_id: orgContext.getOrThrow(),
        label: input.label,
        url: input.url,
        url_type: input.urlType,
        description: input.description,
        method: input.method,
        auth_required: input.authRequired ?? false,
        auth_method: input.authMethod,
        status: input.status ?? 'active',
        healthcheck_enabled: input.healthcheckEnabled ?? false,
        last_check_status: input.lastCheckStatus,
        last_checked_at: input.lastCheckedAt,
        tags: input.tags ?? [],
        metadata: input.metadata ?? {},
      })
      .returning('id')) as { id: string }[];

    const created = await this.findById(row.id);
    if (!created) {
      throw new Error('Falha ao criar URL');
    }
    return created;
  }

  public async update(id: string, input: UpdateUrlInput): Promise<Url | undefined> {
    const updateData: Record<string, unknown> = {};

    if (input.label !== undefined) updateData.label = input.label;
    if (input.url !== undefined) updateData.url = input.url;
    if (input.urlType !== undefined) updateData.url_type = input.urlType;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.method !== undefined) updateData.method = input.method;
    if (input.authRequired !== undefined) updateData.auth_required = input.authRequired;

    if (input.authMethod !== undefined) updateData.auth_method = input.authMethod;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.healthcheckEnabled !== undefined) updateData.healthcheck_enabled = input.healthcheckEnabled;
    if (input.lastCheckStatus !== undefined) updateData.last_check_status = input.lastCheckStatus;
    if (input.lastCheckedAt !== undefined) updateData.last_checked_at = input.lastCheckedAt;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    await this.db(TABLE_NAME).where({ id }).update(updateData);
    return this.findById(id);
  }

  public async setStatus(id: string, status: string): Promise<Url | undefined> {
    await this.db(TABLE_NAME).where({ id }).update({ status });
    return this.findById(id);
  }

  public async softDelete(id: string): Promise<boolean> {
    const result = await this.db(TABLE_NAME).where({ id }).update({ deleted_at: this.db.fn.now() });
    return result > 0;
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const affected = (await this.db(TABLE_NAME)
      .whereNull('deleted_at')
      .whereIn('id', ids)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected;
  }
}
