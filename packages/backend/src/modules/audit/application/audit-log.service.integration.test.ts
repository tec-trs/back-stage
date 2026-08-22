import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { AuditLogRepository } from '../infrastructure/audit-log.repository.js';

import { AuditLogService } from './audit-log.service.js';

interface TestContext {
  db: Knex | null;
  auditService: AuditLogService | null;
  orgId: string;
}

describe('AuditLogService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    auditService: null,
    orgId: '',
  };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();

    // Create test organization
    const [org] = (await ctx.db('organizations')
      .insert({
        slug: `audit-test-${Date.now()}`,
        name: 'Audit Test Org',
        plan: 'enterprise',
        metadata: JSON.stringify({}),
      })
      .returning(['id'])) as Array<{ id: string }>;

    ctx.orgId = org.id;

    // Initialize AuditLogService with real database
    const auditRepository = new AuditLogRepository(ctx.db);
    ctx.auditService = new AuditLogService(auditRepository);
  });

  afterEach(async () => {
    if (ctx.db) {
      await resetTestDatabase(ctx.db);
    }
  });

  afterAll(async () => {
    if (ctx.db) {
      await teardownTestDatabase(ctx.db);
    }
  }, 30000);

  it('lists audit logs with pagination', async () => {
    jest.setTimeout(10000);

    // Setup: Create 10 audit logs
    const logIds: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const [log] = (await ctx.db('audit_logs')
        .insert({
          actor_user_id: `user-${Date.now()}`,
          action: 'resource_accessed',
          resource_type: 'catalog',
          resource_id: `resource-${i}`,
          ip_address: '192.168.1.1',
          user_agent: 'Test Browser',
          metadata: JSON.stringify({ request_id: `req-${i}` }),
        })
        .returning(['id'])) as Array<{ id: string }>;
      logIds.push(log.id);
    }

    // Act: Fetch first page with 5 items per page
    const result = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.list({}, { page: 1, pageSize: 5 })
    );

    // Assert: Page 1 contains 5 items, total is 10
    expect(result.items).toHaveLength(5);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(5);

    // Verify each log has proper structure
    result.items.forEach((log) => {
      expect(log.id).toBeDefined();
      expect(log.action).toBe('resource_accessed');
      expect(log.resourceType).toBe('catalog');
      expect(log.createdAt).toBeDefined();
    });

    // Act: Fetch second page
    const page2 = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.list({}, { page: 2, pageSize: 5 })
    );

    // Assert: Page 2 contains remaining 5 items
    expect(page2.items).toHaveLength(5);
    expect(page2.pagination.page).toBe(2);
  });

  it('filters audit logs by action', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create logs with different actions
    await ctx.db('audit_logs').insert([
      {
        actor_user_id: `user-${timestamp}`,
        action: 'user_login',
        resource_type: 'user',
        resource_id: `user-1`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
      {
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `catalog-1`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
      {
        actor_user_id: `user-${timestamp}`,
        action: 'user_login',
        resource_type: 'user',
        resource_id: `user-2`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
    ]);

    // Act: Filter by user_login action
    const result = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.list({ action: 'user_login' }, { page: 1, pageSize: 10 })
    );

    // Assert: Only login events returned
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    result.items.forEach((log) => {
      expect(log.action).toBe('user_login');
    });
  });

  it('filters audit logs by resourceType', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create logs with different resource types
    await ctx.db('audit_logs').insert([
      {
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `catalog-1`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
      {
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'governance',
        resource_id: `policy-1`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
      {
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `catalog-2`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
    ]);

    // Act: Filter by catalog resource type
    const result = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.list({ resourceType: 'catalog' }, { page: 1, pageSize: 10 })
    );

    // Assert: Only catalog resources returned
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    result.items.forEach((log) => {
      expect(log.resourceType).toBe('catalog');
    });
  });

  it('filters audit logs by resourceId', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    const resourceId = `resource-${timestamp}`;

    // Setup: Create logs with same and different resource IDs
    await ctx.db('audit_logs').insert([
      {
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: resourceId,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
      {
        actor_user_id: `user-${timestamp}`,
        action: 'resource_updated',
        resource_type: 'catalog',
        resource_id: resourceId,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
      {
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `other-${timestamp}`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
    ]);

    // Act: Filter by specific resource ID
    const result = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.list({ resourceId }, { page: 1, pageSize: 10 })
    );

    // Assert: Only logs for target resource returned
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    result.items.forEach((log) => {
      expect(log.resourceId).toBe(resourceId);
    });
  });

  it('filters audit logs by actorUserId', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    const actorUserId = `actor-${timestamp}`;

    // Setup: Create logs from different actors
    await ctx.db('audit_logs').insert([
      {
        actor_user_id: actorUserId,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `resource-1`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
      {
        actor_user_id: `other-actor-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `resource-2`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
      {
        actor_user_id: actorUserId,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `resource-3`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      },
    ]);

    // Act: Filter by specific actor
    const result = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.list({ actorUserId }, { page: 1, pageSize: 10 })
    );

    // Assert: Only logs from target actor returned
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    result.items.forEach((log) => {
      expect(log.actorUserId).toBe(actorUserId);
    });
  });

  it('deletes audit logs by IDs and returns deleted count', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create 5 audit logs
    const [log1] = (await ctx.db('audit_logs')
      .insert({
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `resource-1`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      })
      .returning(['id'])) as Array<{ id: string }>;

    const [log2] = (await ctx.db('audit_logs')
      .insert({
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `resource-2`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      })
      .returning(['id'])) as Array<{ id: string }>;

    const [log3] = (await ctx.db('audit_logs')
      .insert({
        actor_user_id: `user-${timestamp}`,
        action: 'resource_accessed',
        resource_type: 'catalog',
        resource_id: `resource-3`,
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        metadata: JSON.stringify({}),
      })
      .returning(['id'])) as Array<{ id: string }>;

    // Act: Delete 2 logs
    const deleteResult = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.deleteByIds([log1.id, log2.id])
    );

    // Assert: Deleted count is 2
    expect(deleteResult.deleted).toBe(2);

    // Verify remaining logs in database
    const remaining = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.list({}, { page: 1, pageSize: 10 })
    );

    expect(remaining.items).toHaveLength(1);
    expect(remaining.items[0].id).toBe(log3.id);
  });

  it('handles empty delete operation gracefully', async () => {
    jest.setTimeout(10000);

    // Setup: Create a log to ensure table is not empty
    await ctx.db('audit_logs').insert({
      actor_user_id: `user-${Date.now()}`,
      action: 'resource_accessed',
      resource_type: 'catalog',
      resource_id: `resource-1`,
      ip_address: '192.168.1.1',
      user_agent: 'Test Browser',
      metadata: JSON.stringify({}),
    });

    // Act: Try to delete with empty ID list
    const deleteResult = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.deleteByIds([])
    );

    // Assert: Returns 0 deleted
    expect(deleteResult.deleted).toBe(0);

    // Verify original log still exists
    const remaining = await orgContext.run(ctx.orgId, async () =>
      ctx.auditService!.list({}, { page: 1, pageSize: 10 })
    );

    expect(remaining.items).toHaveLength(1);
  });
});
