import { ConflictError, NotFoundError } from '@back-stage/shared';
import type { Knex } from 'knex';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import type { CreateServerInput } from '../infrastructure/server.repository.js';
import { ServerRepository } from '../infrastructure/server.repository.js';

import { ServerService } from './server.service.js';

interface TestContext {
  db: Knex | null;
  serverService: ServerService | null;
  repository: ServerRepository | null;
}

describe('ServerService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    serverService: null,
    repository: null,
  };

  const auditContext = {
    actorUserId: 'test-user-id',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
  };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    ctx.repository = new ServerRepository(ctx.db);
    ctx.serverService = new ServerService(ctx.repository);
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

  it('lists servers with pagination', async () => {
    jest.setTimeout(10000);

    // Setup: Create 10 servers
    const timestamp = Date.now();
    for (let i = 1; i <= 10; i++) {
      await ctx.repository!.create({
        hostname: `server-${timestamp}-${i}`,
        environment: 'production',
        serverType: 'physical',
        provider: 'on-premises',
      });
    }

    // Act: List first page (5 servers per page)
    const result = await ctx.serverService!.list({}, { page: 1, pageSize: 5 });

    // Assert: Page contains 5 items
    expect(result.items).toHaveLength(5);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(5);

    // Act: List second page
    const page2 = await ctx.serverService!.list({}, { page: 2, pageSize: 5 });

    // Assert: Page 2 contains remaining 5
    expect(page2.items).toHaveLength(5);
    expect(page2.pagination.page).toBe(2);
  });

  it('filters servers by status', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create servers with different statuses
    await ctx.repository!.create({
      hostname: `server-active-${timestamp}`,
      status: 'active',
      environment: 'production',
      serverType: 'physical',
      provider: 'on-premises',
    });

    await ctx.repository!.create({
      hostname: `server-inactive-${timestamp}`,
      status: 'inactive',
      environment: 'production',
      serverType: 'physical',
      provider: 'on-premises',
    });

    await ctx.repository!.create({
      hostname: `server-active-2-${timestamp}`,
      status: 'active',
      environment: 'production',
      serverType: 'physical',
      provider: 'on-premises',
    });

    // Act: Filter by active status
    const result = await ctx.serverService!.list({ status: 'active' }, { page: 1, pageSize: 10 });

    // Assert: Only active servers returned
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    result.items.forEach((server) => {
      expect(server.status).toBe('active');
    });
  });

  it('creates server and prevents duplicate hostname', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    const hostname = `unique-server-${timestamp}`;
    const input: CreateServerInput = {
      hostname,
      environment: 'production',
      serverType: 'physical',
      provider: 'on-premises',
    };

    // Act: Create first server
    const server1 = await ctx.serverService!.create(input, auditContext);

    // Assert: Server created successfully
    expect(server1.id).toBeDefined();
    expect(server1.hostname).toBe(hostname);

    // Act & Assert: Try to create second server with same hostname (should fail)
    await expect(ctx.serverService!.create(input, auditContext)).rejects.toThrow(ConflictError);

    // Verify only one server exists
    const result = await ctx.serverService!.list({}, { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(1);
  });

  it('updates server properties', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    const hostname = `server-to-update-${timestamp}`;

    // Setup: Create server
    const server = await ctx.repository!.create({
      hostname,
      environment: 'staging',
      serverType: 'physical',
      provider: 'on-premises',
      cpuCores: 4,
    });

    // Act: Update server
    const updated = await ctx.serverService!.update(
      server.id,
      {
        cpuCores: 8,
        ramGb: 32,
      },
      auditContext,
    );

    // Assert: Changes persisted
    expect(updated).toBeDefined();
    expect(updated!.cpuCores).toBe(8);
    expect(updated!.ramGb).toBe(32);

    // Verify via getById
    const retrieved = await ctx.serverService!.getById(server.id);
    expect(retrieved.cpuCores).toBe(8);
  });

  it('updates server status', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create server with initial status
    const server = await ctx.repository!.create({
      hostname: `server-status-${timestamp}`,
      status: 'active',
      environment: 'production',
      serverType: 'physical',
      provider: 'on-premises',
    });

    // Act: Change status
    const updated = await ctx.serverService!.setStatus(server.id, 'maintenance', auditContext);

    // Assert: Status updated
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('maintenance');

    // Verify via getById
    const retrieved = await ctx.serverService!.getById(server.id);
    expect(retrieved.status).toBe('maintenance');
  });

  it('prevents deletion when server has linked applications', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create server
    const server = await ctx.repository!.create({
      hostname: `server-with-apps-${timestamp}`,
      environment: 'production',
      serverType: 'physical',
      provider: 'on-premises',
    });

    // Setup: Mock hasLinkedApplications to return true
    jest.spyOn(ctx.repository!, 'hasLinkedApplications').mockResolvedValue(true);

    // Act & Assert: Try to delete (should fail with ConflictError)
    await expect(ctx.serverService!.delete(server.id, auditContext)).rejects.toThrow(ConflictError);

    // Verify server still exists (not deleted)
    const retrieved = await ctx.serverService!.getById(server.id);
    expect(retrieved.id).toBe(server.id);
  });

  it('soft deletes server without linked applications', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create server
    const server = await ctx.repository!.create({
      hostname: `server-to-delete-${timestamp}`,
      environment: 'production',
      serverType: 'physical',
      provider: 'on-premises',
    });

    // Setup: Mock hasLinkedApplications to return false
    jest.spyOn(ctx.repository!, 'hasLinkedApplications').mockResolvedValue(false);

    // Act: Delete server
    await ctx.serverService!.delete(server.id, auditContext);

    // Assert: Server is no longer retrievable (soft deleted)
    await expect(ctx.serverService!.getById(server.id)).rejects.toThrow(NotFoundError);

    // Verify it was soft deleted (count should be 0)
    const result = await ctx.serverService!.list({}, { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(0);
  });

  it('bulk deletes multiple servers', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create 5 servers
    const serverIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const server = await ctx.repository!.create({
        hostname: `server-bulk-${timestamp}-${i}`,
        environment: 'production',
        serverType: 'physical',
        provider: 'on-premises',
      });
      serverIds.push(server.id);
    }

    // Setup: Mock serversWithLinkedApplications to return empty array
    jest.spyOn(ctx.repository!, 'serversWithLinkedApplications').mockResolvedValue([]);

    // Act: Bulk delete 3 servers
    const deleted = await ctx.serverService!.bulkDelete(serverIds.slice(0, 3), auditContext);

    // Assert: 3 servers deleted
    expect(deleted).toBe(3);

    // Verify remaining servers
    const result = await ctx.serverService!.list({}, { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(2); // Only 2 remain
    expect(result.pagination.total).toBe(2);
  });

  it('throws NotFoundError when server does not exist', async () => {
    jest.setTimeout(10000);

    const nonExistentId = 'non-existent-server-id-12345';

    // Act & Assert: Try to get non-existent server
    await expect(ctx.serverService!.getById(nonExistentId)).rejects.toThrow(NotFoundError);

    // Act & Assert: Try to update non-existent server
    await expect(
      ctx.serverService!.update(nonExistentId, { cpuCores: 8 }, auditContext),
    ).rejects.toThrow(NotFoundError);

    // Act & Assert: Try to change status of non-existent server
    await expect(
      ctx.serverService!.setStatus(nonExistentId, 'active', auditContext),
    ).rejects.toThrow(NotFoundError);
  });
});
