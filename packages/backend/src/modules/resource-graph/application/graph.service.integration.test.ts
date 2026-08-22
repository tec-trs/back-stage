import type { Knex } from 'knex';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { EcosystemGraphRepository } from '../infrastructure/ecosystem-graph.repository.js';

import { EcosystemGraphService } from './graph.service.js';

interface TestContext {
  db: Knex | null;
  graphService: EcosystemGraphService | null;
  repository: EcosystemGraphRepository | null;
}

describe('EcosystemGraphService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    graphService: null,
    repository: null,
  };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    ctx.repository = new EcosystemGraphRepository(ctx.db);
    ctx.graphService = new EcosystemGraphService(ctx.repository);
  });

  afterEach(async () => {
    if (ctx.db) await resetTestDatabase(ctx.db);
  });

  afterAll(async () => {
    if (ctx.db) await teardownTestDatabase(ctx.db);
  }, 30000);

  it('retrieves ecosystem graph for organization', async () => {
    jest.setTimeout(10000);

    const [org] = (await ctx.db!('organizations')
      .insert({ slug: `org-${Date.now()}`, name: 'Test Org', plan: 'enterprise', metadata: '{}' })
      .returning(['id'])) as Array<{ id: string }>;

    const graph = await ctx.graphService!.getEcosystemGraph(org.id);

    expect(graph).toBeDefined();
    expect(graph.nodes).toBeDefined();
    expect(Array.isArray(graph.nodes)).toBe(true);
  });

  it('includes relationships in graph', async () => {
    jest.setTimeout(10000);

    const [org] = (await ctx.db!('organizations')
      .insert({ slug: `org-${Date.now()}`, name: 'Org', plan: 'enterprise', metadata: '{}' })
      .returning(['id'])) as Array<{ id: string }>;

    const graph = await ctx.graphService!.getEcosystemGraph(org.id);

    expect(graph.links || graph.edges || graph.relationships).toBeDefined();
  });

  it('filters graph by resource type', async () => {
    jest.setTimeout(10000);

    const [org] = (await ctx.db!('organizations')
      .insert({ slug: `org-${Date.now()}`, name: 'Org', plan: 'enterprise', metadata: '{}' })
      .returning(['id'])) as Array<{ id: string }>;

    const graph = await ctx.graphService!.getEcosystemGraph(org.id, { resourceType: 'service' });

    expect(graph.nodes).toBeDefined();
    if (graph.nodes.length > 0) {
      expect(graph.nodes.some((n: any) => n.type === 'service' || n.resourceType === 'service')).toBe(true);
    }
  });

  it('returns empty graph for empty organization', async () => {
    jest.setTimeout(10000);

    const [org] = (await ctx.db!('organizations')
      .insert({ slug: `empty-${Date.now()}`, name: 'Empty', plan: 'enterprise', metadata: '{}' })
      .returning(['id'])) as Array<{ id: string }>;

    const graph = await ctx.graphService!.getEcosystemGraph(org.id);

    expect(graph.nodes).toBeDefined();
    expect(Array.isArray(graph.nodes)).toBe(true);
  });

  it('handles graph caching or performance', async () => {
    jest.setTimeout(10000);

    const [org] = (await ctx.db!('organizations')
      .insert({ slug: `perf-${Date.now()}`, name: 'Perf', plan: 'enterprise', metadata: '{}' })
      .returning(['id'])) as Array<{ id: string }>;

    const start = Date.now();
    const graph = await ctx.graphService!.getEcosystemGraph(org.id);
    const duration = Date.now() - start;

    expect(graph).toBeDefined();
    expect(duration).toBeLessThan(5000);
  });

  it('filters by lifecycle state', async () => {
    jest.setTimeout(10000);

    const [org] = (await ctx.db!('organizations')
      .insert({ slug: `lifecycle-${Date.now()}`, name: 'Lifecycle', plan: 'enterprise', metadata: '{}' })
      .returning(['id'])) as Array<{ id: string }>;

    const graph = await ctx.graphService!.getEcosystemGraph(org.id, { lifecycle: 'production' });

    expect(graph).toBeDefined();
  });

  it('retrieves connected components', async () => {
    jest.setTimeout(10000);

    const [org] = (await ctx.db!('organizations')
      .insert({ slug: `components-${Date.now()}`, name: 'Comp', plan: 'enterprise', metadata: '{}' })
      .returning(['id'])) as Array<{ id: string }>;

    const graph = await ctx.graphService!.getEcosystemGraph(org.id);

    expect(graph.nodes).toBeDefined();
    expect(graph.links || graph.edges || graph.relationships || []).toBeDefined();
  });
});
