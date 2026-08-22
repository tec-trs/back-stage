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
});
