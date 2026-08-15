import type { Knex } from 'knex';

import { ServerType, type ServerTypeRow } from '../domain/server-type.entity.js';

export interface CreateServerTypeData {
  slug: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateServerTypeData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface IServerTypeRepository {
  findAll(): Promise<ServerType[]>;
  findById(id: string): Promise<ServerType | null>;
  findBySlug(slug: string): Promise<ServerType | null>;
  create(data: CreateServerTypeData): Promise<ServerType>;
  update(id: string, data: UpdateServerTypeData): Promise<ServerType | null>;
  delete(id: string): Promise<boolean>;
}

export class ServerTypeRepository implements IServerTypeRepository {
  constructor(private readonly db: Knex) {}

  private toEntity(row: ServerTypeRow): ServerType {
    return new ServerType(row);
  }

  async findAll(): Promise<ServerType[]> {
    const rows = await this.db<ServerTypeRow>('server_types').orderBy('name', 'asc');
    return rows.map((row) => this.toEntity(row));
  }

  async findById(id: string): Promise<ServerType | null> {
    const row = await this.db<ServerTypeRow>('server_types').where({ id }).first();
    return row ? this.toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<ServerType | null> {
    const row = await this.db<ServerTypeRow>('server_types').where({ slug }).first();
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateServerTypeData): Promise<ServerType> {
    const [row] = await this.db<ServerTypeRow>('server_types')
      .insert({
        slug: data.slug,
        name: data.name,
        description: data.description ?? null,
        is_active: data.isActive ?? true,
      })
      .returning('*');
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateServerTypeData): Promise<ServerType | null> {
    const patch: Partial<ServerTypeRow> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.isActive !== undefined) patch.is_active = data.isActive;

    const [row] = await this.db<ServerTypeRow>('server_types')
      .where({ id })
      .update(patch)
      .returning('*');
    return row ? this.toEntity(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const count = await this.db('server_types').where({ id }).delete();
    return count > 0;
  }
}
