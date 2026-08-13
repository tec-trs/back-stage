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

export class UserAuthRepository {
  public constructor(private readonly db: Knex) {}

  public async findByCode(code: string): Promise<UserAuthRecord | undefined> {
    return this.db<UserAuthRecord>('users')
      .select('id', 'code', 'email', 'full_name', 'password_hash', 'roles', 'is_active')
      .where({ code })
      .whereNull('deleted_at')
      .first();
  }
}
