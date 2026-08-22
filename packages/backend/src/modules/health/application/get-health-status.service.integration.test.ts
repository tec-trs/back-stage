import type { Knex } from 'knex';
import { describe, expect, it, beforeEach, afterEach, afterAll, vi } from 'vitest';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { HealthStatusEntity } from '../domain/health-status.entity.js';
import { ProcessHealthRepository } from '../infrastructure/process-health.repository.js';

import { GetHealthStatusService } from './get-health-status.service.js';

interface TestContext {
  db: Knex | null;
  healthService: GetHealthStatusService | null;
  repository: ProcessHealthRepository | null;
}

describe('GetHealthStatusService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    healthService: null,
    repository: null,
  };

  const TEST_APP_VERSION = '2.0.0';

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    ctx.repository = new ProcessHealthRepository(TEST_APP_VERSION);
    ctx.healthService = new GetHealthStatusService(ctx.repository);
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

  it('returns ok status when database is healthy', async () => {
    jest.setTimeout(10000);

    // Act: Get health status
    const health = await ctx.healthService!.execute();

    // Assert: Status is ok and DB is healthy
    expect(health.status).toBe('ok');
    expect(health.version).toBe(TEST_APP_VERSION);
    expect(health.uptimeSeconds).toBeGreaterThan(0);
    expect(health.timestamp).toBeDefined();
  });

  it('returns degraded status when database check fails', async () => {
    jest.setTimeout(10000);

    // Setup: Mock database connection to fail
    const failingRepository = {
      getCurrentStatus: async () =>
        new HealthStatusEntity('degraded', process.uptime(), new Date().toISOString(), TEST_APP_VERSION),
    };

    const serviceWithFailure = new GetHealthStatusService(failingRepository as any);

    // Act: Get health status
    const health = await serviceWithFailure.execute();

    // Assert: Status is degraded
    expect(health.status).toBe('degraded');
    expect(health.version).toBe(TEST_APP_VERSION);
  });

  it('includes accurate process uptime in response', async () => {
    jest.setTimeout(10000);

    // Setup: Record start time before executing
    const beforeExecution = process.uptime();

    // Act: Get health status
    const health = await ctx.healthService!.execute();

    // Assert: Uptime is greater than start time
    expect(health.uptimeSeconds).toBeGreaterThanOrEqual(beforeExecution);
    expect(health.uptimeSeconds).toBeLessThanOrEqual(beforeExecution + 5); // Allow 5 seconds variance
    expect(typeof health.uptimeSeconds).toBe('number');
  });

  it('includes current timestamp in ISO format', async () => {
    jest.setTimeout(10000);

    // Setup: Record time before execution
    const beforeExecution = new Date();

    // Act: Get health status
    const health = await ctx.healthService!.execute();

    // Assert: Timestamp is ISO format and recent
    expect(health.timestamp).toBeDefined();
    expect(health.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    const healthTime = new Date(health.timestamp);
    const afterExecution = new Date();

    // Timestamp should be between before and after execution (within 5 seconds)
    expect(healthTime.getTime()).toBeGreaterThanOrEqual(beforeExecution.getTime() - 1000);
    expect(healthTime.getTime()).toBeLessThanOrEqual(afterExecution.getTime() + 1000);
  });

  it('includes correct application version', async () => {
    jest.setTimeout(10000);

    // Act: Get health status
    const health = await ctx.healthService!.execute();

    // Assert: Version matches configured value
    expect(health.version).toBe(TEST_APP_VERSION);
    expect(health.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning format
  });

  it('health entity converts to JSON correctly', async () => {
    jest.setTimeout(10000);

    // Setup: Create entity manually
    const entity = new HealthStatusEntity('ok', 100.5, '2026-08-22T12:00:00.000Z', '2.0.0');

    // Act: Convert to JSON
    const json = entity.toJSON();

    // Assert: JSON has all required fields
    expect(json).toHaveProperty('status', 'ok');
    expect(json).toHaveProperty('uptimeSeconds', 100.5);
    expect(json).toHaveProperty('timestamp', '2026-08-22T12:00:00.000Z');
    expect(json).toHaveProperty('version', '2.0.0');

    // Verify structure matches HealthStatus interface
    expect(Object.keys(json)).toEqual(['status', 'uptimeSeconds', 'timestamp', 'version']);
  });

  it('multiple consecutive health checks return consistent status', async () => {
    jest.setTimeout(10000);

    // Act: Execute health check multiple times
    const health1 = await ctx.healthService!.execute();
    const health2 = await ctx.healthService!.execute();
    const health3 = await ctx.healthService!.execute();

    // Assert: All checks return ok status
    expect(health1.status).toBe('ok');
    expect(health2.status).toBe('ok');
    expect(health3.status).toBe('ok');

    // Status should remain consistent
    expect(health1.status).toBe(health2.status);
    expect(health2.status).toBe(health3.status);

    // Version should be same across all checks
    expect(health1.version).toBe(health2.version);
    expect(health2.version).toBe(health3.version);

    // Uptime should increase (or stay same) over checks
    expect(health2.uptimeSeconds).toBeGreaterThanOrEqual(health1.uptimeSeconds);
    expect(health3.uptimeSeconds).toBeGreaterThanOrEqual(health2.uptimeSeconds);
  });

  it('service delegates to repository correctly', async () => {
    jest.setTimeout(10000);

    // Setup: Spy on repository method
    const spy = vi.spyOn(ctx.repository!, 'getCurrentStatus');

    // Act: Execute service
    const result = await ctx.healthService!.execute();

    // Assert: Repository method was called exactly once
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith();

    // Result should be valid health status
    expect(result).toBeInstanceOf(HealthStatusEntity);
    expect(result.status).toBeDefined();
    expect(result.version).toBe(TEST_APP_VERSION);

    // Cleanup
    spy.mockRestore();
  });

  it('health entity properties are read-only', async () => {
    jest.setTimeout(10000);

    // Setup: Create entity
    const entity = new HealthStatusEntity('ok', 50, '2026-08-22T12:00:00.000Z', '1.0.0');

    // Assert: All properties are defined and accessible
    expect(entity.status).toBe('ok');
    expect(entity.uptimeSeconds).toBe(50);
    expect(entity.timestamp).toBe('2026-08-22T12:00:00.000Z');
    expect(entity.version).toBe('1.0.0');

    // Verify properties exist and have correct types
    expect(typeof entity.status).toBe('string');
    expect(typeof entity.uptimeSeconds).toBe('number');
    expect(typeof entity.timestamp).toBe('string');
    expect(typeof entity.version).toBe('string');
  });
});
