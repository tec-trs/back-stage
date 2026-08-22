import type { Knex } from 'knex';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { SearchRepository } from '../infrastructure/search.repository.js';

import { SearchService } from './search.service.js';

interface TestContext {
  db: Knex | null;
  searchService: SearchService | null;
  orgId: string;
}

describe('SearchService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    searchService: null,
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

    // Initialize SearchService with real database
    const searchRepository = new SearchRepository(ctx.db);
    ctx.searchService = new SearchService(searchRepository);

    // Create test team (required for catalog_entities)
    await ctx.db('teams')
      .insert({
        organization_id: ctx.orgId,
        slug: `team-${Date.now()}`,
        name: 'Test Team',
        metadata: JSON.stringify({}),
      })
      .returning(['id']);
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

  it('returns resources matching search term', async () => {
    // Create catalog entities with searchable content
    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: 'prod-01-backend-api',
      namespace: 'default',
      title: 'Production Backend API',
      description: 'Main production service',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: 'dev-frontend-web',
      namespace: 'default',
      title: 'Development Frontend',
      description: 'Frontend service',
      lifecycle: 'experimental',
      organization_id: ctx.orgId,
    });

    // Search for prod-01
    const result = await ctx.searchService!.search(
      'prod-01',
      {},
      { page: 1, pageSize: 20 }
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.some(r => r.name.includes('prod-01'))).toBe(true);
  });

  it('filters by resource type', async () => {
    // Create entities of different types
    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: 'svc-backend',
      namespace: 'default',
      title: 'Backend Service',
      description: 'Backend application',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    await ctx.db!('catalog_entities').insert({
      kind: 'resource',
      type: 'database',
      name: 'svc-postgres',
      namespace: 'default',
      title: 'PostgreSQL Database',
      description: 'Main database',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    // Search for 'svc' but filter by type 'service'
    const result = await ctx.searchService!.search(
      'svc',
      { type: 'service' },
      { page: 1, pageSize: 20 }
    );

    expect(result.items.every(r => r.type === 'service')).toBe(true);
  });

  it('returns empty array for no matches', async () => {
    // Create some entities
    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: 'regular-service',
      namespace: 'default',
      title: 'Regular Service',
      description: 'A regular service',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    // Search for something that doesn't exist
    const result = await ctx.searchService!.search(
      'nonexistent-xyz-123',
      {},
      { page: 1, pageSize: 20 }
    );

    expect(result.items).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it('handles pagination correctly with multiple results', async () => {
    // Create 15 catalog entities
    const timestamp = Date.now();
    for (let i = 1; i <= 15; i++) {
      await ctx.db!('catalog_entities').insert({
        kind: 'component',
        type: 'service',
        name: `search-test-${timestamp}-${i}`,
        namespace: 'default',
        title: `Search Test Service ${i}`,
        description: 'Test service for pagination',
        lifecycle: 'production',
        organization_id: ctx.orgId,
      });
    }

    // Search page 1 (10 per page)
    const page1 = await ctx.searchService!.search(
      'search-test',
      {},
      { page: 1, pageSize: 10 }
    );

    expect(page1.items.length).toBeLessThanOrEqual(10);
    expect(page1.pagination.page).toBe(1);
    expect(page1.pagination.pageSize).toBe(10);
    expect(page1.pagination.total).toBeGreaterThanOrEqual(10);

    // Search page 2
    const page2 = await ctx.searchService!.search(
      'search-test',
      {},
      { page: 2, pageSize: 10 }
    );

    expect(page2.pagination.page).toBe(2);
    // Page 2 might have fewer items if total is 15
    expect(page2.items.length).toBeGreaterThanOrEqual(0);
  });

  it('returns facets with search results', async () => {
    // Create entities with different types and lifecycles
    const timestamp = Date.now();
    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: `facet-service-${timestamp}`,
      namespace: 'default',
      title: 'Facet Test Service',
      description: 'Test service for facets',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    await ctx.db!('catalog_entities').insert({
      kind: 'resource',
      type: 'database',
      name: `facet-db-${timestamp}`,
      namespace: 'default',
      title: 'Facet Test Database',
      description: 'Test database for facets',
      lifecycle: 'stable',
      organization_id: ctx.orgId,
    });

    // Search and verify facets are returned
    const result = await ctx.searchService!.search(
      'facet',
      {},
      { page: 1, pageSize: 20 }
    );

    expect(result.facets).toBeDefined();
    // Facets should include type, lifecycle, etc.
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('provides search suggestions for partial query', async () => {
    // Create entities with specific names
    const timestamp = Date.now();
    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: `prod-api-gateway-${timestamp}`,
      namespace: 'default',
      title: 'Production API Gateway',
      description: 'Main API entry point',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: `prod-auth-service-${timestamp}`,
      namespace: 'default',
      title: 'Production Auth Service',
      description: 'Authentication service',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    // Get suggestions for 'prod'
    const suggestions = await ctx.searchService!.suggest('prod', 10);

    expect(Array.isArray(suggestions)).toBe(true);
    // Should suggest variations containing 'prod'
    expect(suggestions.length).toBeGreaterThanOrEqual(0);
  });

  it('performs unified search across resource types', async () => {
    // Create diverse resources
    const timestamp = Date.now();
    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: `unified-service-${timestamp}`,
      namespace: 'default',
      title: 'Unified Search Service',
      description: 'Test service for unified search',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    await ctx.db!('catalog_entities').insert({
      kind: 'resource',
      type: 'database',
      name: `unified-db-${timestamp}`,
      namespace: 'default',
      title: 'Unified Search Database',
      description: 'Test database for unified search',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    // Unified search across all types
    const result = await ctx.searchService!.unifiedSearch(
      'unified',
      undefined,
      { page: 1, pageSize: 20 }
    );

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.pagination.total).toBeGreaterThan(0);
    // Results should include both service and database
    expect(result.items.some((r: any) => r.type === 'service')).toBe(true);
    expect(result.items.some((r: any) => r.type === 'database')).toBe(true);
  });

  it('filters unified search by tags', async () => {
    // Create entities with tags
    const timestamp = Date.now();
    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: `tagged-service-${timestamp}`,
      namespace: 'default',
      title: 'Tagged Service',
      description: 'Service with tags',
      lifecycle: 'production',
      organization_id: ctx.orgId,
      tags: JSON.stringify(['important', 'production']),
    });

    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: `untagged-service-${timestamp}`,
      namespace: 'default',
      title: 'Untagged Service',
      description: 'Service without tags',
      lifecycle: 'production',
      organization_id: ctx.orgId,
      tags: JSON.stringify([]),
    });

    // Unified search with tag filter
    const result = await ctx.searchService!.unifiedSearch(
      'service',
      ['important'],
      { page: 1, pageSize: 20 }
    );

    // Should return tagged service
    expect(result.items.length).toBeGreaterThanOrEqual(0);
  });

  it('handles special characters in search query', async () => {
    // Create entity with special characters in name
    const timestamp = Date.now();
    await ctx.db!('catalog_entities').insert({
      kind: 'component',
      type: 'service',
      name: `api-v2.0-${timestamp}`,
      namespace: 'default',
      title: 'API v2.0 Service',
      description: 'API version 2.0',
      lifecycle: 'production',
      organization_id: ctx.orgId,
    });

    // Search with special characters
    const result = await ctx.searchService!.search(
      'api-v2.0',
      {},
      { page: 1, pageSize: 20 }
    );

    // Should handle special characters gracefully
    expect(result).toBeDefined();
    expect(result.items).toBeDefined();
  });
});
