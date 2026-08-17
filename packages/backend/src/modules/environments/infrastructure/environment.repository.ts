import type { Knex } from 'knex';

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
}

export class EnvironmentRepository implements IEnvironmentRepository {
  public constructor(private readonly knex: Knex) {}

  public async findAll(): Promise<Environment[]> {
    const rows = await this.knex<EnvironmentRow>(TABLE_NAME).orderBy('name');
    return rows.map((row) => new Environment(row));
  }

  public async findById(id: string): Promise<Environment | undefined> {
    const row = await this.knex<EnvironmentRow>(TABLE_NAME).where('id', id).first();
    return row ? new Environment(row) : undefined;
  }

  public async findBySlug(slug: string): Promise<Environment | undefined> {
    const row = await this.knex<EnvironmentRow>(TABLE_NAME).where('slug', slug).first();
    return row ? new Environment(row) : undefined;
  }

  public async create(input: CreateEnvironmentInput): Promise<Environment> {
    const [row] = await this.knex<EnvironmentRow>(TABLE_NAME)
      .insert({
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? 'default',
        is_active: input.isActive ?? true,
      })
      .returning('*');
    return new Environment(row!);
  }

  public async update(id: string, input: UpdateEnvironmentInput): Promise<Environment | null> {
    const patch: Partial<EnvironmentRow> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.color !== undefined) patch.color = input.color;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    const [row] = await this.knex<EnvironmentRow>(TABLE_NAME)
      .where('id', id)
      .update(patch)
      .returning('*');
    return row ? new Environment(row) : null;
  }

  public async delete(id: string): Promise<void> {
    await this.knex<EnvironmentRow>(TABLE_NAME).where('id', id).delete();
  }
}
