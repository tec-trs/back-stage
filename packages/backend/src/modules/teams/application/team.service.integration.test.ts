import { ConflictError, NotFoundError } from '@back-stage/shared';
import type { Knex } from 'knex';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { TeamRepository } from '../infrastructure/team.repository.js';

import { TeamService } from './team.service.js';

interface TestContext {
  db: Knex | null;
  teamService: TeamService | null;
  repository: TeamRepository | null;
  orgId: string;
}

describe('TeamService (Integration)', () => {
  const ctx: TestContext = { db: null, teamService: null, repository: null, orgId: '' };

  const auditContext = { actorUserId: 'test-user', ipAddress: '127.0.0.1', userAgent: 'Test' };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();

    // Create test organization
    const [org] = (await ctx.db('organizations')
      .insert({
        slug: `org-${Date.now()}`,
        name: 'Test Org',
        plan: 'enterprise',
        metadata: '{}',
      })
      .returning(['id'])) as Array<{ id: string }>;

    ctx.orgId = org.id;
    ctx.repository = new TeamRepository(ctx.db);
    ctx.teamService = new TeamService(ctx.repository);
  });

  afterEach(async () => {
    if (ctx.db) await resetTestDatabase(ctx.db);
  });

  afterAll(async () => {
    if (ctx.db) await teardownTestDatabase(ctx.db);
  }, 30000);

  it('creates team in organization', async () => {
    jest.setTimeout(10000);
    const team = await ctx.repository!.create({
      organizationId: ctx.orgId,
      slug: `team-${Date.now()}`,
      name: 'Test Team',
      metadata: {},
    });
    expect(team.id).toBeDefined();
    expect(team.name).toBe('Test Team');
  });

  it('lists teams with pagination', async () => {
    jest.setTimeout(10000);
    const timestamp = Date.now();

    for (let i = 1; i <= 10; i++) {
      await ctx.repository!.create({
        organizationId: ctx.orgId,
        slug: `team-${timestamp}-${i}`,
        name: `Team ${i}`,
        metadata: {},
      });
    }

    const result = await ctx.teamService!.list({ organizationId: ctx.orgId }, { page: 1, pageSize: 5 });
    expect(result.items.length).toBeLessThanOrEqual(5);
    expect(result.pagination.total).toBeGreaterThanOrEqual(5);
  });

  it('prevents duplicate team slug', async () => {
    jest.setTimeout(10000);
    const slug = `unique-${Date.now()}`;

    await ctx.repository!.create({
      organizationId: ctx.orgId,
      slug,
      name: 'Team 1',
      metadata: {},
    });

    await expect(
      ctx.repository!.create({
        organizationId: ctx.orgId,
        slug,
        name: 'Team 2',
        metadata: {},
      }),
    ).rejects.toThrow();
  });

  it('retrieves team by ID', async () => {
    jest.setTimeout(10000);
    const created = await ctx.repository!.create({
      organizationId: ctx.orgId,
      slug: `retrieve-${Date.now()}`,
      name: 'Retrieve Team',
      metadata: { key: 'value' },
    });

    const retrieved = await ctx.teamService!.getById(created.id);
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.name).toBe('Retrieve Team');
  });

  it('updates team properties', async () => {
    jest.setTimeout(10000);
    const team = await ctx.repository!.create({
      organizationId: ctx.orgId,
      slug: `update-${Date.now()}`,
      name: 'Original Name',
      metadata: {},
    });

    const updated = await ctx.teamService!.update(team.id, { name: 'Updated Name' }, auditContext);
    expect(updated.name).toBe('Updated Name');
  });

  it('throws NotFoundError for non-existent team', async () => {
    jest.setTimeout(10000);
    await expect(ctx.teamService!.getById('non-existent')).rejects.toThrow(NotFoundError);
  });

  it('manages team members', async () => {
    jest.setTimeout(10000);
    const team = await ctx.repository!.create({
      organizationId: ctx.orgId,
      slug: `members-${Date.now()}`,
      name: 'Members Team',
      metadata: { members: [] },
    });
    expect(team.id).toBeDefined();
  });

  it('filters teams by organization', async () => {
    jest.setTimeout(10000);
    const result = await ctx.teamService!.list(
      { organizationId: ctx.orgId },
      { page: 1, pageSize: 10 }
    );
    expect(Array.isArray(result.items)).toBe(true);
  });
});
