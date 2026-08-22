import type { Knex } from 'knex';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { orgContext } from '../../../shared/context/org-context.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { CatalogEntityRepository } from '../infrastructure/catalog-entity.repository.js';

import { CatalogEntityService } from './catalog-entity.service.js';

interface TestContext {
  db: Knex | null;
  catalogService: CatalogEntityService | null;
  orgId: string;
}

describe('CatalogEntityService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    catalogService: null,
    orgId: '',
  };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();

    // Create test organization
    const [org] = (await ctx.db('organizations')
      .insert({
        slug: `test-org-${Date.now()}`,
        name: 'Test Organization',
        plan: 'enterprise',
        metadata: JSON.stringify({}),
      })
      .returning(['id'])) as Array<{ id: string }>;

    ctx.orgId = org.id;

    // Initialize CatalogEntityService with real database
    const catalogRepository = new CatalogEntityRepository(ctx.db);
    ctx.catalogService = new CatalogEntityService(catalogRepository);
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
  });

  it('lists catalog entities with pagination', async () => {
    // Setup: Create 5 test entities (server, app, database, url, vip)
    const entities = [
      {
        id: `entity-server-${Date.now()}`,
        kind: 'server',
        type: 'compute',
        name: 'prod-server-01',
        namespace: 'production',
        title: 'Production Server',
        description: 'Main production server',
        lifecycle: 'active',
        owner_team_id: null,
        system_id: null,
        repository_url: null,
        metadata: JSON.stringify({ environment: 'prod', tier: 'critical' }),
      },
      {
        id: `entity-app-${Date.now()}`,
        kind: 'application',
        type: 'api',
        name: 'payment-svc',
        namespace: 'production',
        title: 'Payment Service',
        description: 'Payment processing API',
        lifecycle: 'active',
        owner_team_id: null,
        system_id: null,
        repository_url: null,
        metadata: JSON.stringify({ owner: 'team-payments', slo: '99.99%' }),
      },
      {
        id: `entity-db-${Date.now()}`,
        kind: 'database',
        type: 'postgresql',
        name: 'postgres-main',
        namespace: 'production',
        title: 'Main Database',
        description: 'Primary PostgreSQL instance',
        lifecycle: 'active',
        owner_team_id: null,
        system_id: null,
        repository_url: null,
        metadata: JSON.stringify({ version: '16', backup: 'hourly' }),
      },
      {
        id: `entity-url-${Date.now()}`,
        kind: 'url',
        type: 'api',
        name: 'api-gateway',
        namespace: 'production',
        title: 'API Gateway',
        description: 'Main API endpoint',
        lifecycle: 'active',
        owner_team_id: null,
        system_id: null,
        repository_url: null,
        metadata: JSON.stringify({ protocol: 'https', port: 443 }),
      },
      {
        id: `entity-vip-${Date.now()}`,
        kind: 'vip',
        type: 'load-balancer',
        name: 'balancer-prod',
        namespace: 'production',
        title: 'Production Balancer',
        description: 'Load balancer for production',
        lifecycle: 'active',
        owner_team_id: null,
        system_id: null,
        repository_url: null,
        metadata: JSON.stringify({ algorithm: 'round-robin' }),
      },
    ];

    await ctx.db!('catalog_entities').insert(entities);

    // Act: Call catalogService.list() with pagination
    const result = await orgContext.run(ctx.orgId, async () =>
      ctx.catalogService!.list({}, { page: 1, pageSize: 5 })
    );

    // Assert: Verify paginated results structure
    expect(result).toBeDefined();
    expect(result.items).toHaveLength(5);
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 5,
      total: 5,
    });

    // Verify each item has correct properties
    result.items.forEach((item) => {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('kind');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('name');
      expect(item).toHaveProperty('namespace');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('lifecycle');
      expect(item).toHaveProperty('metadata');
      expect(item).toHaveProperty('createdAt');
      expect(item).toHaveProperty('updatedAt');
    });

    // Verify entities are from different kinds
    const kinds = result.items.map((item) => item.kind);
    expect(kinds).toContain('server');
    expect(kinds).toContain('application');
    expect(kinds).toContain('database');
    expect(kinds).toContain('url');
    expect(kinds).toContain('vip');
  });

  it('filters entities by multiple attributes', async () => {
    // Setup: Create 10 diverse entities with different kinds and lifecycles
    const entities = [
      // 5 servers: 2 active, 3 deprecated
      {
        id: `srv-active-1-${Date.now()}`,
        kind: 'server',
        type: 'compute',
        name: 'server-active-1',
        namespace: 'prod',
        lifecycle: 'active',
      },
      {
        id: `srv-active-2-${Date.now()}`,
        kind: 'server',
        type: 'compute',
        name: 'server-active-2',
        namespace: 'prod',
        lifecycle: 'active',
      },
      {
        id: `srv-deprecated-1-${Date.now()}`,
        kind: 'server',
        type: 'compute',
        name: 'server-deprecated-1',
        namespace: 'prod',
        lifecycle: 'deprecated',
      },
      {
        id: `srv-deprecated-2-${Date.now()}`,
        kind: 'server',
        type: 'compute',
        name: 'server-deprecated-2',
        namespace: 'prod',
        lifecycle: 'deprecated',
      },
      {
        id: `srv-deprecated-3-${Date.now()}`,
        kind: 'server',
        type: 'compute',
        name: 'server-deprecated-3',
        namespace: 'prod',
        lifecycle: 'deprecated',
      },
      // 3 applications: 2 active, 1 experimental
      {
        id: `app-active-1-${Date.now()}`,
        kind: 'application',
        type: 'api',
        name: 'app-active-1',
        namespace: 'prod',
        lifecycle: 'active',
      },
      {
        id: `app-active-2-${Date.now()}`,
        kind: 'application',
        type: 'api',
        name: 'app-active-2',
        namespace: 'prod',
        lifecycle: 'active',
      },
      {
        id: `app-experimental-1-${Date.now()}`,
        kind: 'application',
        type: 'api',
        name: 'app-experimental-1',
        namespace: 'prod',
        lifecycle: 'experimental',
      },
      // 2 databases: all active
      {
        id: `db-active-1-${Date.now()}`,
        kind: 'database',
        type: 'postgresql',
        name: 'db-active-1',
        namespace: 'prod',
        lifecycle: 'active',
      },
      {
        id: `db-active-2-${Date.now()}`,
        kind: 'database',
        type: 'postgresql',
        name: 'db-active-2',
        namespace: 'prod',
        lifecycle: 'active',
      },
    ];

    await ctx.db!('catalog_entities').insert(
      entities.map((e) => ({
        ...e,
        title: e.name,
        description: null,
        owner_team_id: null,
        system_id: null,
        repository_url: null,
        metadata: JSON.stringify({}),
      }))
    );

    // Act: Filter by kind='application' AND lifecycle='active'
    const result = await orgContext.run(ctx.orgId, async () =>
      ctx.catalogService!.list(
        { kind: 'application', lifecycle: 'active' },
        { page: 1, pageSize: 100 }
      )
    );

    // Assert: Should return exactly 2 active applications
    expect(result.items).toHaveLength(2);
    expect(result.pagination.total).toBe(2);

    // Verify all items match the filters
    result.items.forEach((item) => {
      expect(item.kind).toBe('application');
      expect(item.lifecycle).toBe('active');
    });

    // Verify no servers, experimental apps, or databases in results
    const kinds = result.items.map((item) => item.kind);
    expect(kinds).not.toContain('server');
    expect(kinds).not.toContain('database');

    const lifecycles = result.items.map((item) => item.lifecycle);
    expect(lifecycles).not.toContain('deprecated');
    expect(lifecycles).not.toContain('experimental');
  });

  it('preserves custom metadata during CRUD operations', async () => {
    // Setup: Create entity with complex nested metadata
    const testMetadata = {
      owner: 'team-payments',
      tier: 'premium',
      tags: ['prod', 'critical', 'pci-compliant'],
      slo: {
        uptime: '99.99%',
        latency_p99: '100ms',
      },
      dependencies: ['postgres-main', 'redis-cache'],
    };

    const [entity] = (await ctx.db!('catalog_entities')
      .insert({
        id: `entity-metadata-test-${Date.now()}`,
        kind: 'application',
        type: 'api',
        name: 'payment-service',
        namespace: 'production',
        title: 'Payment Service',
        description: 'Payment processing service',
        lifecycle: 'active',
        owner_team_id: null,
        system_id: null,
        repository_url: null,
        metadata: JSON.stringify(testMetadata),
      })
      .returning('*')) as Array<{ id: string }>;

    // Act: Retrieve entity by ID
    const result = await orgContext.run(ctx.orgId, async () =>
      ctx.catalogService!.getById(entity.id)
    );

    // Assert: Metadata is preserved exactly
    expect(result).toBeDefined();
    expect(result.metadata).toEqual(testMetadata);

    // Verify nested structures are intact
    expect(result.metadata.slo).toEqual({
      uptime: '99.99%',
      latency_p99: '100ms',
    });

    expect(result.metadata.dependencies).toEqual(['postgres-main', 'redis-cache']);

    expect(result.metadata.tags).toContain('pci-compliant');

    // Verify dates are Date objects
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });
});
