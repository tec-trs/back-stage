import type { Knex } from 'knex';

import { User, type UserRow } from '../domain/user.entity.js';

const TABLE_NAME = 'users';

const SAFE_COLUMNS = [
  'id',
  'code',
  'email',
  'full_name',
  'avatar_url',
  'is_active',
  'roles',
  'metadata',
  'created_at',
  'updated_at',
];

export interface UserFilters {
  isActive?: boolean;
  search?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface CreateUserInput {
  code: string;
  email: string;
  fullName: string;
  passwordHash: string;
  roles: string[];
}

export interface UpdateUserInput {
  code?: string;
  email?: string;
  fullName?: string;
  roles?: string[];
  passwordHash?: string;
}

export interface IUserRepository {
  findMany(filters: UserFilters, pagination: Pagination): Promise<{ items: User[]; total: number }>;
  findById(id: string): Promise<User | undefined>;
  findByEmail(email: string): Promise<User | undefined>;
  findByCode(code: string): Promise<User | undefined>;
  create(input: CreateUserInput): Promise<User>;
  update(id: string, input: UpdateUserInput): Promise<User | undefined>;
  setActive(id: string, isActive: boolean): Promise<User | undefined>;
  softDelete(id: string): Promise<boolean>;
}

export class UserRepository implements IUserRepository {
  public constructor(private readonly db: Knex) {}

  private baseQuery(): Knex.QueryBuilder {
    return this.db(TABLE_NAME).select(SAFE_COLUMNS).whereNull('deleted_at');
  }

  public async findMany(
    filters: UserFilters,
    pagination: Pagination,
  ): Promise<{ items: User[]; total: number }> {
    const filteredQuery = this.db(TABLE_NAME).whereNull('deleted_at');

    if (filters.isActive !== undefined) {
      filteredQuery.where('is_active', filters.isActive);
    }
    if (filters.search) {
      filteredQuery.where((builder) => {
        builder
          .whereILike('full_name', `%${filters.search}%`)
          .orWhereILike('email', `%${filters.search}%`)
          .orWhereILike('code', `%${filters.search}%`);
      });
    }

    const countQuery = filteredQuery.clone().clearSelect().count<{ count: string }[]>('* as count');
    const rowsQuery = filteredQuery
      .clone()
      .select(SAFE_COLUMNS)
      .orderBy('full_name', 'asc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const [countResult, rows] = await Promise.all([countQuery, rowsQuery]);

    return {
      items: (rows as UserRow[]).map((row) => new User(row)),
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  public async findById(id: string): Promise<User | undefined> {
    const row = (await this.baseQuery().where('id', id).first()) as UserRow | undefined;
    return row ? new User(row) : undefined;
  }

  public async findByEmail(email: string): Promise<User | undefined> {
    const row = (await this.baseQuery().where({ email }).first()) as UserRow | undefined;
    return row ? new User(row) : undefined;
  }

  public async findByCode(code: string): Promise<User | undefined> {
    const row = (await this.baseQuery().where({ code }).first()) as UserRow | undefined;
    return row ? new User(row) : undefined;
  }

  public async create(input: CreateUserInput): Promise<User> {
    const rows = (await this.db(TABLE_NAME)
      .insert({
        code: input.code,
        email: input.email,
        full_name: input.fullName,
        password_hash: input.passwordHash,
        roles: input.roles,
        is_active: true,
        metadata: JSON.stringify({}),
      })
      .returning(SAFE_COLUMNS)) as UserRow[];

    return new User(rows[0]);
  }

  public async update(id: string, input: UpdateUserInput): Promise<User | undefined> {
    const patch: Record<string, unknown> = {};

    if (input.code !== undefined) patch.code = input.code;
    if (input.email !== undefined) patch.email = input.email;
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.roles !== undefined) patch.roles = input.roles;
    if (input.passwordHash !== undefined) patch.password_hash = input.passwordHash;

    if (Object.keys(patch).length === 0) {
      return this.findById(id);
    }

    const rows = (await this.db(TABLE_NAME)
      .whereNull('deleted_at')
      .where('id', id)
      .update(patch)
      .returning(SAFE_COLUMNS)) as UserRow[];

    return rows[0] ? new User(rows[0]) : undefined;
  }

  public async setActive(id: string, isActive: boolean): Promise<User | undefined> {
    const rows = (await this.db(TABLE_NAME)
      .whereNull('deleted_at')
      .where('id', id)
      .update({ is_active: isActive })
      .returning(SAFE_COLUMNS)) as UserRow[];

    return rows[0] ? new User(rows[0]) : undefined;
  }

  public async softDelete(id: string): Promise<boolean> {
    const affected = (await this.db(TABLE_NAME)
      .whereNull('deleted_at')
      .where('id', id)
      .update({ deleted_at: this.db.fn.now() })) as unknown as number;
    return affected > 0;
  }
}
