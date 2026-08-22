import { ConflictError, NotFoundError } from '@back-stage/shared';
import type { Knex } from 'knex';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import type { CreateApplicationInput } from '../infrastructure/application.repository.js';
import { ApplicationRepository } from '../infrastructure/application.repository.js';

import { ApplicationService } from './application.service.js';

interface TestContext {
  db: Knex | null;
  applicationService: ApplicationService | null;
  repository: ApplicationRepository | null;
}

describe('ApplicationService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    applicationService: null,
    repository: null,
  };

  const auditContext = {
    actorUserId: 'test-user-id',
    ipAddress: '127.0.0.1',
    userAgent: 'Test Browser',
  };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    ctx.repository = new ApplicationRepository(ctx.db);
    ctx.applicationService = new ApplicationService(ctx.repository);
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

  it('lists applications with pagination', async () => {
    jest.setTimeout(10000);

    // Setup: Create 10 applications
    const timestamp = Date.now();
    for (let i = 1; i <= 10; i++) {
      await ctx.repository!.create({
        code: `app-${timestamp}-${i}`,
        name: `Application ${i}`,
        description: `Test app ${i}`,
      });
    }

    // Act: List first page (5 apps per page)
    const result = await ctx.applicationService!.list({}, { page: 1, pageSize: 5 });

    // Assert: Page contains 5 items
    expect(result.items).toHaveLength(5);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.pageSize).toBe(5);

    // Act: List second page
    const page2 = await ctx.applicationService!.list({}, { page: 2, pageSize: 5 });

    // Assert: Page 2 contains remaining 5
    expect(page2.items).toHaveLength(5);
    expect(page2.pagination.page).toBe(2);
  });

  it('filters applications by status', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create applications with different statuses
    await ctx.repository!.create({
      code: `app-active-${timestamp}`,
      name: 'Active App',
      status: 'active',
    });

    await ctx.repository!.create({
      code: `app-inactive-${timestamp}`,
      name: 'Inactive App',
      status: 'inactive',
    });

    await ctx.repository!.create({
      code: `app-active-2-${timestamp}`,
      name: 'Active App 2',
      status: 'active',
    });

    // Act: Filter by active status
    const result = await ctx.applicationService!.list({ status: 'active' }, { page: 1, pageSize: 10 });

    // Assert: Only active applications returned
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
    result.items.forEach((app) => {
      expect(app.status).toBe('active');
    });
  });

  it('creates application and prevents duplicate code', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    const code = `unique-app-${timestamp}`;
    const input: CreateApplicationInput = {
      code,
      name: 'Test Application',
      description: 'Test description',
    };

    // Act: Create first application
    const app1 = await ctx.applicationService!.create(input, auditContext);

    // Assert: Application created successfully
    expect(app1.id).toBeDefined();
    expect(app1.code).toBe(code);

    // Act & Assert: Try to create second application with same code (should fail)
    await expect(ctx.applicationService!.create(input, auditContext)).rejects.toThrow(ConflictError);

    // Verify only one application exists
    const result = await ctx.applicationService!.list({}, { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(1);
  });

  it('updates application properties', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();
    const code = `app-to-update-${timestamp}`;

    // Setup: Create application
    const app = await ctx.repository!.create({
      code,
      name: 'Original Name',
      description: 'Original Description',
    });

    // Act: Update application
    const updated = await ctx.applicationService!.update(
      app.id,
      {
        name: 'Updated Name',
        description: 'Updated Description',
      },
      auditContext,
    );

    // Assert: Changes persisted
    expect(updated).toBeDefined();
    expect(updated!.name).toBe('Updated Name');
    expect(updated!.description).toBe('Updated Description');

    // Verify via getById
    const retrieved = await ctx.applicationService!.getById(app.id);
    expect(retrieved.name).toBe('Updated Name');
  });

  it('updates application status', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create application with initial status
    const app = await ctx.repository!.create({
      code: `app-status-${timestamp}`,
      name: 'Test Application',
      status: 'active',
    });

    // Act: Change status
    const updated = await ctx.applicationService!.setStatus(app.id, 'inactive', auditContext);

    // Assert: Status updated
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('inactive');

    // Verify via getById
    const retrieved = await ctx.applicationService!.getById(app.id);
    expect(retrieved.status).toBe('inactive');
  });

  it('prevents deletion when application has deployments', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create application
    const app = await ctx.repository!.create({
      code: `app-with-deployments-${timestamp}`,
      name: 'Application with Deployments',
    });

    // Setup: Mock applicationsWithDeployments to return this app
    jest.spyOn(ctx.repository!, 'applicationsWithDeployments').mockResolvedValue([app.id]);

    // Act & Assert: Try to delete (should fail with ConflictError)
    await expect(ctx.applicationService!.delete(app.id, auditContext)).rejects.toThrow(
      NotFoundError,
    );

    // Verify application still exists
    const retrieved = await ctx.applicationService!.getById(app.id);
    expect(retrieved.id).toBe(app.id);
  });

  it('soft deletes application without deployments', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create application
    const app = await ctx.repository!.create({
      code: `app-to-delete-${timestamp}`,
      name: 'Application to Delete',
    });

    // Act: Delete application
    await ctx.applicationService!.delete(app.id, auditContext);

    // Assert: Application is no longer retrievable (soft deleted)
    await expect(ctx.applicationService!.getById(app.id)).rejects.toThrow(NotFoundError);

    // Verify it was soft deleted (count should be 0)
    const result = await ctx.applicationService!.list({}, { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(0);
  });

  it('bulk deletes multiple applications', async () => {
    jest.setTimeout(10000);

    const timestamp = Date.now();

    // Setup: Create 5 applications
    const appIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const app = await ctx.repository!.create({
        code: `app-bulk-${timestamp}-${i}`,
        name: `Application ${i}`,
      });
      appIds.push(app.id);
    }

    // Setup: Mock applicationsWithDeployments to return empty array
    jest.spyOn(ctx.repository!, 'applicationsWithDeployments').mockResolvedValue([]);

    // Act: Bulk delete 3 applications
    const deleted = await ctx.applicationService!.bulkDelete(appIds.slice(0, 3), auditContext);

    // Assert: 3 applications deleted
    expect(deleted).toBe(3);

    // Verify remaining applications
    const result = await ctx.applicationService!.list({}, { page: 1, pageSize: 10 });
    expect(result.items).toHaveLength(2); // Only 2 remain
    expect(result.pagination.total).toBe(2);
  });

  it('throws NotFoundError when application does not exist', async () => {
    jest.setTimeout(10000);

    const nonExistentId = 'non-existent-app-id-12345';

    // Act & Assert: Try to get non-existent application
    await expect(ctx.applicationService!.getById(nonExistentId)).rejects.toThrow(NotFoundError);

    // Act & Assert: Try to update non-existent application
    await expect(
      ctx.applicationService!.update(nonExistentId, { name: 'Updated' }, auditContext),
    ).rejects.toThrow(NotFoundError);

    // Act & Assert: Try to change status of non-existent application
    await expect(
      ctx.applicationService!.setStatus(nonExistentId, 'inactive', auditContext),
    ).rejects.toThrow(NotFoundError);

    // Act & Assert: Try to delete non-existent application
    await expect(ctx.applicationService!.delete(nonExistentId, auditContext)).rejects.toThrow(
      NotFoundError,
    );
  });
});
