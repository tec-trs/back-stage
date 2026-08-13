import type { Knex } from 'knex';

import { Service, type ServiceRow } from '../domain/service.entity.js';

const TABLE_NAME = 'catalog_entities';
const KIND = 'component';

export interface ServiceFilters {
  lifecycle?: string;
  ownerTeamId?: string;
  systemId?: string;
  namespace?: string;
  type?: string;
}

export interface ServiceSort {
  sortBy: 'name' | 'createdAt' | 'updatedAt' | 'lifecycle';
  sortOrder: 'asc' | 'desc';
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface CreateServiceInput {
  type: string;
  name: string;
  namespace: string;
  title?: string | null;
  description?: string | null;
  lifecycle: string;
  ownerTeamId?: string | null;
  systemId?: string | null;
  repositoryUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export type UpdateServiceInput = Partial<CreateServiceInput>;

const SORT_COLUMN_MAP: Record<ServiceSort['sortBy'], string> = {
  name: 'name',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  lifecycle: 'lifecycle',
};

export interface IServiceRepository {
  findMany(
    filters: ServiceFilters,
    sort: ServiceSort,
    pagination: Pagination,
  ): Promise<{ items: Service[]; total: number }>;
  findById(id: string): Promise<Service | undefined>;
  findByNamespaceAndName(namespace: string, name: string): Promise<Service | undefined>;
  search(query: string, limit: number): Promise<Service[]>;
  create(input: CreateServiceInput): Promise<Service>;
  update(id: string, input: UpdateServiceInput): Promise<Service | undefined>;
  softDelete(id: string): Promise<boolean>;
}

export class ServiceRepository implements IServiceRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME).where({ kind: KIND }).whereNull('deleted_at');
  }

  private applyFilters(query: Knex.QueryBuilder, filters: ServiceFilters): Knex.QueryBuilder {
    if (filters.lifecycle) query.where('lifecycle', filters.lifecycle);
    if (filters.ownerTeamId) query.where('owner_team_id', filters.ownerTeamId);
    if (filters.systemId) query.where('system_id', filters.systemId);
    if (filters.namespace) query.where('namespace', filters.namespace);
    if (filters.type) query.where('type', filters.type);
    return query;
  }

  public async findMany(
    filters: ServiceFilters,
    sort: ServiceSort,
    pagination: Pagination,
  ): Promise<{ items: Service[]; total: number }> {
    const filteredQuery = this.applyFilters(this.baseQuery(), filters);

    const countQuery = filteredQuery.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = filteredQuery
      .clone()
      .orderBy(SORT_COLUMN_MAP[sort.sortBy], sort.sortOrder)
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);

    return {
      items: (rows as ServiceRow[]).map((row) => new Service(row)),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  public async findById(id: string): Promise<Service | undefined> {
    const row = (await this.baseQuery().where('id', id).first()) as ServiceRow | undefined;
    return row ? new Service(row) : undefined;
  }

  public async findByNamespaceAndName(
    namespace: string,
    name: string,
  ): Promise<Service | undefined> {
    const row = (await this.baseQuery().where({ namespace, name }).first()) as
      ServiceRow | undefined;
    return row ? new Service(row) : undefined;
  }

  public async search(query: string, limit: number): Promise<Service[]> {
    const rows = (await this.baseQuery()
      .where((builder) => {
        builder
          .whereILike('name', `%${query}%`)
          .orWhereILike('title', `%${query}%`)
          .orWhereILike('description', `%${query}%`);
      })
      .orderBy('name', 'asc')
      .limit(limit)) as ServiceRow[];

    return rows.map((row) => new Service(row));
  }

  public async create(input: CreateServiceInput): Promise<Service> {
    const rows = (await this.db(TABLE_NAME)
      .insert({
        kind: KIND,
        type: input.type,
        name: input.name,
        namespace: input.namespace,
        title: input.title ?? null,
        description: input.description ?? null,
        lifecycle: input.lifecycle,
        owner_team_id: input.ownerTeamId ?? null,
        system_id: input.systemId ?? null,
        repository_url: input.repositoryUrl ?? null,
        metadata: JSON.stringify(input.metadata ?? {}),
      })
      .returning('*')) as ServiceRow[];

    return new Service(rows[0]);
  }

  public async update(id: string, input: UpdateServiceInput): Promise<Service | undefined> {
    const patch: Record<string, unknown> = {};

    if (input.type !== undefined) patch.type = input.type;
    if (input.name !== undefined) patch.name = input.name;
    if (input.namespace !== undefined) patch.namespace = input.namespace;
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.lifecycle !== undefined) patch.lifecycle = input.lifecycle;
    if (input.ownerTeamId !== undefined) patch.owner_team_id = input.ownerTeamId;
    if (input.systemId !== undefined) patch.system_id = input.systemId;
    if (input.repositoryUrl !== undefined) patch.repository_url = input.repositoryUrl;
    if (input.metadata !== undefined) patch.metadata = JSON.stringify(input.metadata);

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const rows = (await this.baseQuery()
      .where('id', id)
      .update(patch)
      .returning('*')) as ServiceRow[];

    return rows[0] ? new Service(rows[0]) : undefined;
  }

  public async softDelete(id: string): Promise<boolean> {
    const affected = (await this.baseQuery()
      .where('id', id)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected > 0;
  }
}
