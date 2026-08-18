import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';
import { Environment, type EnvironmentRow } from '../domain/environment.entity.js';

const TABLE_NAME = 'environments';

export interface CreateEnvironmentInput {
  slug: string;
  name: string;
  description?: string | null;
  color?: string;
  isActive?: boolean;
}

export interface UpdateEnvironmentInput {
  name?: string;
  description?: string | null;
  color?: string;
  isActive?: boolean;
}

export interface IEnvironmentRepository {
  findAll(): Promise<Environment[]>;
  findById(id: string): Promise<Environment | undefined>;
  findBySlug(slug: string): Promise<Environment | undefined>;
  create(input: CreateEnvironmentInput): Promise<Environment>;
  update(id: string, input: UpdateEnvironmentInput): Promise<Environment | null>;
  delete(id: string): Promise<void>;
  bulkSoftDelete(ids: string[]): Promise<number>;
}

export class EnvironmentRepository implements IEnvironmentRepository {
  public constructor(private readonly knex: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.knex(TABLE_NAME)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at');
  }

  public async findAll(): Promise<Environment[]> {
    const rows = await this.baseQuery().orderBy('name');
    return rows.map((row: EnvironmentRow) => new Environment(row));
  }

  public async findById(id: string): Promise<Environment | undefined> {
    const row = await this.baseQuery().where('id', id).first();
    return row ? new Environment(row) : undefined;
  }

  public async findBySlug(slug: string): Promise<Environment | undefined> {
    const row = await this.baseQuery().where('slug', slug).first();
    return row ? new Environment(row) : undefined;
  }

  public async create(input: CreateEnvironmentInput): Promise<Environment> {
    const [row] = await this.knex(TABLE_NAME)
      .insert({
        organization_id: orgContext.getOrThrow(),
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? 'default',
        is_active: input.isActive ?? true,
      })
      .returning('*');
    return new Environment(row as EnvironmentRow);
  }

  public async update(id: string, input: UpdateEnvironmentInput): Promise<Environment | null> {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.color !== undefined) patch.color = input.color;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    const [row] = await this.baseQuery()
      .where('id', id)
      .update(patch)
      .returning('*');
    return row ? new Environment(row as EnvironmentRow) : null;
  }

  public async delete(id: string): Promise<void> {
    await this.baseQuery().where('id', id).delete();
  }

  public async bulkSoftDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const affected = (await this.baseQuery()
      .whereNull('deleted_at')
      .whereIn('id', ids)
      .update({ deleted_at: this.knex.fn.now() })) as unknown as number;
    return affected;
  }
}
