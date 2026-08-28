import type { Knex } from 'knex';

import { DatabaseEngine, type DatabaseEngineRow } from '../domain/database-engine.entity.js';

const TABLE_NAME = 'database_engines';

export interface CreateDatabaseEngineInput {
  slug: string;
  name: string;
  description?: string | null;
  defaultPort?: number | null;
  isActive?: boolean;
}

export interface UpdateDatabaseEngineInput {
  name?: string;
  description?: string | null;
  defaultPort?: number | null;
  isActive?: boolean;
}

export interface IDatabaseEngineRepository {
  findAll(): Promise<DatabaseEngine[]>;
  findById(id: string): Promise<DatabaseEngine | undefined>;
  findBySlug(slug: string): Promise<DatabaseEngine | undefined>;
  findActive(): Promise<DatabaseEngine[]>;
  create(input: CreateDatabaseEngineInput): Promise<DatabaseEngine>;
  update(id: string, input: UpdateDatabaseEngineInput): Promise<DatabaseEngine | undefined>;
  delete(id: string): Promise<boolean>;
}

export class DatabaseEngineRepository implements IDatabaseEngineRepository {
  public constructor(private readonly db: Knex) {}

  public async findAll(): Promise<DatabaseEngine[]> {
    const rows = (await this.db(TABLE_NAME).orderBy('name')) as DatabaseEngineRow[];
    return rows.map((row) => new DatabaseEngine(row));
  }

  public async findById(id: string): Promise<DatabaseEngine | undefined> {
    const row = (await this.db(TABLE_NAME).where('id', id).first()) as DatabaseEngineRow | undefined;
    return row ? new DatabaseEngine(row) : undefined;
  }

  public async findBySlug(slug: string): Promise<DatabaseEngine | undefined> {
    const row = (await this.db(TABLE_NAME).where('slug', slug).first()) as DatabaseEngineRow | undefined;
    return row ? new DatabaseEngine(row) : undefined;
  }

  public async findActive(): Promise<DatabaseEngine[]> {
    const rows = (await this.db(TABLE_NAME).where('is_active', true).orderBy('name')) as DatabaseEngineRow[];
    return rows.map((row) => new DatabaseEngine(row));
  }

  public async create(input: CreateDatabaseEngineInput): Promise<DatabaseEngine> {
    const [row] = (await this.db(TABLE_NAME)
      .insert({
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        default_port: input.defaultPort ?? null,
        is_active: input.isActive ?? true,
      })
      .returning('*')) as DatabaseEngineRow[];

    return new DatabaseEngine(row);
  }

  public async update(id: string, input: UpdateDatabaseEngineInput): Promise<DatabaseEngine | undefined> {
    const patch: Record<string, unknown> = {};

    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.defaultPort !== undefined) patch.default_port = input.defaultPort;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const [row] = (await this.db(TABLE_NAME).where('id', id).update(patch).returning('*')) as DatabaseEngineRow[];

    return row ? new DatabaseEngine(row) : undefined;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.db(TABLE_NAME).where('id', id).delete();
    return result > 0;
  }
}
