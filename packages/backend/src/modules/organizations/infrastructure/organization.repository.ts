import type { Knex } from 'knex';

import { Organization, type OrganizationRow } from '../domain/organization.entity.js';

const TABLE = 'organizations';

export interface CreateOrganizationInput {
  slug: string;
  name: string;
  plan?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateOrganizationInput {
  name?: string;
  plan?: string;
  metadata?: Record<string, unknown>;
}

export interface IOrganizationRepository {
  findAll(): Promise<Organization[]>;
  findById(id: string): Promise<Organization | undefined>;
  findBySlug(slug: string): Promise<Organization | undefined>;
  create(input: CreateOrganizationInput): Promise<Organization>;
  update(id: string, input: UpdateOrganizationInput): Promise<Organization | null>;
  softDelete(id: string): Promise<boolean>;
}

export class OrganizationRepository implements IOrganizationRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db<OrganizationRow>(TABLE).whereNull('deleted_at');
  }

  public async findAll(): Promise<Organization[]> {
    const rows = await this.baseQuery().orderBy('name', 'asc');
    return rows.map((r: OrganizationRow) => new Organization(r));
  }

  public async findById(id: string): Promise<Organization | undefined> {
    const row = await this.baseQuery().where('id', id).first() as OrganizationRow | undefined;
    return row ? new Organization(row) : undefined;
  }

  public async findBySlug(slug: string): Promise<Organization | undefined> {
    const row = await this.baseQuery().where('slug', slug).first() as OrganizationRow | undefined;
    return row ? new Organization(row) : undefined;
  }

  public async create(input: CreateOrganizationInput): Promise<Organization> {
    const [row] = (await this.db<OrganizationRow>(TABLE)
      .insert({
        slug: input.slug,
        name: input.name,
        plan: input.plan ?? 'free',
        metadata: input.metadata ?? {},
      })
      .returning('*')) as OrganizationRow[];
    return new Organization(row!);
  }

  public async update(id: string, input: UpdateOrganizationInput): Promise<Organization | null> {
    const patch: Partial<OrganizationRow> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.plan !== undefined) patch.plan = input.plan;
    if (input.metadata !== undefined) patch.metadata = input.metadata;

    if (Object.keys(patch).length === 0) return (await this.findById(id)) ?? null;

    const [row] = (await this.db<OrganizationRow>(TABLE)
      .where('id', id)
      .whereNull('deleted_at')
      .update(patch)
      .returning('*')) as OrganizationRow[];
    return row ? new Organization(row) : null;
  }

  public async softDelete(id: string): Promise<boolean> {
    const count = await this.db<OrganizationRow>(TABLE)
      .where('id', id)
      .whereNull('deleted_at')
      .update({ deleted_at: this.db.fn.now() });
    return count > 0;
  }
}
