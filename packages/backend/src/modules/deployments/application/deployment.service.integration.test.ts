import { NotFoundError } from '@back-stage/shared';
import type { Knex } from 'knex';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import type { CreateDeploymentInput } from '../infrastructure/deployment.repository.js';
import { DeploymentRepository } from '../infrastructure/deployment.repository.js';

import { DeploymentService } from './deployment.service.js';

interface TestContext {
  db: Knex | null;
  deploymentService: DeploymentService | null;
  repository: DeploymentRepository | null;
}

describe('DeploymentService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    deploymentService: null,
    repository: null,
  };

  const auditContext = {
    actorUserId: 'test-user-id',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
  };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    ctx.repository = new DeploymentRepository(ctx.db);
    ctx.deploymentService = new DeploymentService(ctx.repository);
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

  it('lists deployments with pagination', async () => {
    jest.setTimeout(10000);

    // Setup: Create 10 deployments
    const timestamp = Date.now();
    for (let i = 1; i <= 10; i++) {
      await ctx.repository!.create({
        entityId: `entity-${timestamp}-${i}`,
        environment: 'production',
        version: `v1.0.${i}`,
        status: 'completed',
      });
    }

    // Act: List first page (5 per page)
    const result = await ctx.deploymentService!.list({}, { page: 1, pageSize: 5 });

    // Assert
    expect(result.items).toHaveLength(5);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.page).toBe(1);
  });

  it('filters deployments by environment', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    await ctx.repository!.create({
      entityId: `entity-prod-${timestamp}`,
      environment: 'production',
      version: 'v1.0.0',
      status: 'completed',
    });

    await ctx.repository!.create({
      entityId: `entity-dev-${timestamp}`,
      environment: 'development',
      version: 'v1.0.0',
      status: 'completed',
    });

    // Act: Filter by production
    const result = await ctx.deploymentService!.list({ environment: 'production' }, { page: 1, pageSize: 10 });

    // Assert
    expect(result.items).toHaveLength(1);
    expect(result.items[0].environment).toBe('production');
  });

  it('creates deployment with audit logging', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    const input: CreateDeploymentInput = {
      entityId: `entity-${timestamp}`,
      environment: 'production',
      version: 'v1.0.0',
    };

    // Act
    const deployment = await ctx.deploymentService!.create(input, auditContext);

    // Assert
    expect(deployment.id).toBeDefined();
    expect(deployment.entityId).toBe(input.entityId);
    expect(deployment.environment).toBe(input.environment);
  });

  it('retrieves deployment by ID', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    const created = await ctx.repository!.create({
      entityId: `entity-${timestamp}`,
      environment: 'staging',
      version: 'v2.0.0',
      status: 'completed',
    });

    // Act
    const retrieved = await ctx.deploymentService!.getById(created.id);

    // Assert
    expect(retrieved.id).toBe(created.id);
    expect(retrieved.version).toBe('v2.0.0');
  });

  it('throws NotFoundError for non-existent deployment', async () => {
    jest.setTimeout(10000);

    // Act & Assert
    await expect(ctx.deploymentService!.getById('non-existent-id')).rejects.toThrow(NotFoundError);
  });

  it('filters deployments by status', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    await ctx.repository!.create({
      entityId: `entity-success-${timestamp}`,
      environment: 'production',
      version: 'v1.0.0',
      status: 'completed',
    });

    await ctx.repository!.create({
      entityId: `entity-failed-${timestamp}`,
      environment: 'production',
      version: 'v1.0.0',
      status: 'failed',
    });

    // Act
    const result = await ctx.deploymentService!.list({ status: 'completed' }, { page: 1, pageSize: 10 });

    // Assert
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('completed');
  });

  it('handles pagination with multiple result pages', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    for (let i = 1; i <= 12; i++) {
      await ctx.repository!.create({
        entityId: `entity-${timestamp}-${i}`,
        environment: 'production',
        version: `v1.0.${i}`,
      });
    }

    // Act: Page 1
    const page1 = await ctx.deploymentService!.list({}, { page: 1, pageSize: 5 });
    // Act: Page 2
    const page2 = await ctx.deploymentService!.list({}, { page: 2, pageSize: 5 });
    // Act: Page 3
    const page3 = await ctx.deploymentService!.list({}, { page: 3, pageSize: 5 });

    // Assert
    expect(page1.items).toHaveLength(5);
    expect(page2.items).toHaveLength(5);
    expect(page3.items).toHaveLength(2); // Remaining items
    expect(page1.pagination.total).toBe(12);
  });
});
