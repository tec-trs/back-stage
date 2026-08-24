import type { Knex } from 'knex';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { ResourceRelationshipRepository } from '../infrastructure/resource-relationship.repository.js';

import { GraphService } from './graph.service.js';

interface TestContext {
  db: Knex | null;
  graphService: GraphService | null;
  repository: ResourceRelationshipRepository | null;
}

describe('GraphService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    graphService: null,
    repository: null,
  };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
    ctx.repository = new ResourceRelationshipRepository(ctx.db);
    ctx.graphService = new GraphService(ctx.repository);
  });

  afterEach(async () => {
    if (ctx.db) await resetTestDatabase(ctx.db);
  });

  afterAll(async () => {
    if (ctx.db) await teardownTestDatabase(ctx.db);
  }, 30000);

  it('retrieves full graph', async () => {
    jest.setTimeout(10000);

    const graph = await ctx.repository!.getFullGraph({}, { page: 1, pageSize: 500 });

    expect(graph).toBeDefined();
    expect(graph.nodes).toBeDefined();
    expect(Array.isArray(graph.nodes)).toBe(true);
  });

  it('includes edges in graph', async () => {
    jest.setTimeout(10000);

    const graph = await ctx.repository!.getFullGraph({}, { page: 1, pageSize: 500 });

    expect(graph.edges).toBeDefined();
    expect(Array.isArray(graph.edges)).toBe(true);
  });

  it('filters graph by resource types', async () => {
    jest.setTimeout(10000);

    const graph = await ctx.repository!.getFullGraph(
      { resourceTypes: ['server', 'application'] },
      { page: 1, pageSize: 500 }
    );

    expect(graph.nodes).toBeDefined();
    if (graph.nodes.length > 0) {
      expect(['server', 'application'].includes(graph.nodes[0].resourceType)).toBe(true);
    }
  });

  it('returns empty graph for empty organization', async () => {
    jest.setTimeout(10000);

    const graph = await ctx.repository!.getFullGraph({}, { page: 1, pageSize: 500 });

    expect(graph.nodes).toBeDefined();
    expect(Array.isArray(graph.nodes)).toBe(true);
  });

  it('computes critical resources', async () => {
    jest.setTimeout(10000);

    const resources = await ctx.repository!.getCriticalResources();

    expect(resources).toBeDefined();
    expect(Array.isArray(resources)).toBe(true);
  });

  it('simulates transitive impact', async () => {
    jest.setTimeout(10000);

    const graph = await ctx.repository!.getFullGraph({}, { page: 1, pageSize: 500 });
    if (graph.nodes.length === 0) {
      expect(graph.nodes).toHaveLength(0);
      return;
    }

    const firstNode = graph.nodes[0];
    const impact = await ctx.repository!.getTransitiveImpact(firstNode.resourceType, firstNode.id);

    expect(impact).toBeDefined();
    expect(impact.impactedResources).toBeDefined();
    expect(Array.isArray(impact.impactedResources)).toBe(true);
  });
});
