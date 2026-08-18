import type { Knex } from 'knex';

export interface UserAuthRecord {
  id: string;
  code: string;
  email: string;
  full_name: string;
  password_hash: string;
  roles: string[];
  is_active: boolean;
}

export interface UserOrganization {
  id: string;
  slug: string;
  name: string;
  role: string;
}

export class UserAuthRepository {
  public constructor(private readonly db: Knex) {}

  public async findByCode(code: string): Promise<UserAuthRecord | undefined> {
    return this.db<UserAuthRecord>('users')
      .select('id', 'code', 'email', 'full_name', 'password_hash', 'roles', 'is_active')
      .where({ code })
      .whereNull('deleted_at')
      .first();
  }

  public async findOrganizationsByUserId(userId: string): Promise<UserOrganization[]> {
    return this.db('organizations as o')
      .join('user_organizations as uo', 'uo.organization_id', 'o.id')
      .where('uo.user_id', userId)
      .whereNull('o.deleted_at')
      .select('o.id', 'o.slug', 'o.name', 'uo.role')
      .orderBy('o.name', 'asc') as Promise<UserOrganization[]>;
  }

  public async findById(userId: string): Promise<UserAuthRecord | undefined> {
    return this.db<UserAuthRecord>('users')
      .select('id', 'code', 'email', 'full_name', 'password_hash', 'roles', 'is_active')
      .where({ id: userId })
      .whereNull('deleted_at')
      .first();
  }

  public async isMember(userId: string, organizationId: string): Promise<boolean> {
    const row = await this.db('user_organizations')
      .where({ user_id: userId, organization_id: organizationId })
      .first();
    return !!row;
  }
}
