import type { Knex } from 'knex';

import { ApplicationType, type ApplicationTypeRow } from '../domain/application-type.entity.js';

export interface CreateApplicationTypeData {
  slug: string;
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateApplicationTypeData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface IApplicationTypeRepository {
  findAll(): Promise<ApplicationType[]>;
  findById(id: string): Promise<ApplicationType | null>;
  findBySlug(slug: string): Promise<ApplicationType | null>;
  create(data: CreateApplicationTypeData): Promise<ApplicationType>;
  update(id: string, data: UpdateApplicationTypeData): Promise<ApplicationType | null>;
  delete(id: string): Promise<boolean>;
  bulkSoftDelete(ids: string[]): Promise<number>;
}

export class ApplicationTypeRepository implements IApplicationTypeRepository {
  constructor(private readonly db: Knex) {}

  private toEntity(row: ApplicationTypeRow): ApplicationType {
    return new ApplicationType(row);
  }

  async findAll(): Promise<ApplicationType[]> {
    const rows = await this.db<ApplicationTypeRow>('application_types').orderBy('name', 'asc');
    return rows.map((row) => this.toEntity(row));
  }

  async findById(id: string): Promise<ApplicationType | null> {
    const row = await this.db<ApplicationTypeRow>('application_types').where({ id }).first();
    return row ? this.toEntity(row) : null;
  }

  async findBySlug(slug: string): Promise<ApplicationType | null> {
    const row = await this.db<ApplicationTypeRow>('application_types').where({ slug }).first();
    return row ? this.toEntity(row) : null;
  }

  async create(data: CreateApplicationTypeData): Promise<ApplicationType> {
    const [row] = await this.db<ApplicationTypeRow>('application_types')
      .insert({
        slug: data.slug,
        name: data.name,
        description: data.description ?? null,
        is_active: data.isActive ?? true,
      })
      .returning('*');
    return this.toEntity(row);
  }

  async update(id: string, data: UpdateApplicationTypeData): Promise<ApplicationType | null> {
    const patch: Partial<ApplicationTypeRow> = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description;
    if (data.isActive !== undefined) patch.is_active = data.isActive;

    const [row] = await this.db<ApplicationTypeRow>('application_types')
      .where({ id })
      .update(patch)
      .returning('*');
    return row ? this.toEntity(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const count = await this.db('application_types').where({ id }).delete();
    return count > 0;
  }

  async bulkSoftDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const affected = (await this.db('application_types')
      .whereNull('deleted_at')
      .whereIn('id', ids)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected;
  }
}
