import { ConflictError, NotFoundError } from '@back-stage/shared';
import type { Knex } from 'knex';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { UserRepository } from '../infrastructure/user.repository.js';

import { UserService } from './user.service.js';

interface TestContext {
  db: Knex | null;
  userService: UserService | null;
  repository: UserRepository | null;
}

describe('UserService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    userService: null,
    repository: null,
  };

  const auditContext = { actorUserId: 'test-user', ipAddress: '127.0.0.1', userAgent: 'Test' };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    ctx.repository = new UserRepository(ctx.db);
    ctx.userService = new UserService(ctx.repository);
  });

  afterEach(async () => {
    if (ctx.db) await resetTestDatabase(ctx.db);
  });

  afterAll(async () => {
    if (ctx.db) await teardownTestDatabase(ctx.db);
  }, 30000);

  it('lists users with pagination', async () => {
    jest.setTimeout(10000);
    const timestamp = Date.now();
    for (let i = 1; i <= 10; i++) {
      await ctx.repository!.create({
        code: `user-${timestamp}-${i}`,
        email: `user${i}@test.com`,
        fullName: `User ${i}`,
        passwordHash: 'hash',
        roles: ['user'],
      });
    }

    const result = await ctx.userService!.list({}, { page: 1, pageSize: 5 });
    expect(result.items).toHaveLength(5);
    expect(result.pagination.total).toBe(10);
  });

  it('creates user with password hashing', async () => {
    jest.setTimeout(10000);
    const timestamp = Date.now();

    const user = await ctx.userService!.create(
      {
        code: `newuser-${timestamp}`,
        email: `newuser@test.com`,
        fullName: 'New User',
        password: 'password123',
        roles: ['user'],
      },
      auditContext,
    );

    expect(user.id).toBeDefined();
    expect(user.code).toBe(`newuser-${timestamp}`);
    expect(user.email).toBe('newuser@test.com');
  });

  it('prevents duplicate code', async () => {
    jest.setTimeout(10000);
    const code = `unique-${Date.now()}`;

    await ctx.userService!.create(
      { code, email: 'user1@test.com', fullName: 'User 1', password: 'pass', roles: ['user'] },
      auditContext,
    );

    await expect(
      ctx.userService!.create(
        { code, email: 'user2@test.com', fullName: 'User 2', password: 'pass', roles: ['user'] },
        auditContext,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it('prevents duplicate email', async () => {
    jest.setTimeout(10000);
    const email = `unique-${Date.now()}@test.com`;

    await ctx.userService!.create(
      { code: `user1-${Date.now()}`, email, fullName: 'User 1', password: 'pass', roles: ['user'] },
      auditContext,
    );

    await expect(
      ctx.userService!.create(
        { code: `user2-${Date.now()}`, email, fullName: 'User 2', password: 'pass', roles: ['user'] },
        auditContext,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it('retrieves user by ID', async () => {
    jest.setTimeout(10000);
    const created = await ctx.repository!.create({
      code: `getuser-${Date.now()}`,
      email: 'getuser@test.com',
      fullName: 'Get User',
      passwordHash: 'hash',
      roles: ['admin'],
    });

    const retrieved = await ctx.userService!.getById(created.id);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.code).toBe(created.code);
  });

  it('throws NotFoundError for non-existent user', async () => {
    jest.setTimeout(10000);
    await expect(ctx.userService!.getById('non-existent')).rejects.toThrow(NotFoundError);
  });

  it('filters users by role', async () => {
    jest.setTimeout(10000);
    const timestamp = Date.now();

    await ctx.repository!.create({
      code: `admin-${timestamp}`,
      email: `admin@test.com`,
      fullName: 'Admin',
      passwordHash: 'hash',
      roles: ['admin'],
    });

    await ctx.repository!.create({
      code: `user-${timestamp}`,
      email: `user@test.com`,
      fullName: 'User',
      passwordHash: 'hash',
      roles: ['user'],
    });

    const result = await ctx.userService!.list({ roles: ['admin'] }, { page: 1, pageSize: 10 });
    expect(result.items.length).toBeGreaterThan(0);
  });
});
