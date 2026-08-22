import { randomUUID } from 'crypto';

import type { Knex } from 'knex';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

import { orgContext } from '../../../shared/context/org-context.js';
import { setupTestDatabase, resetTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { seedTestData, type TestDataIds } from '../../../test-fixtures/seed-data.js';

import { EcosystemGraphRepository } from './ecosystem-graph.repository.js';

describe('EcosystemGraphRepository', () => {
  let db: Knex;
  let repository: EcosystemGraphRepository;
  let testData: TestDataIds;
  let testOrgId: string;

  beforeAll(async () => {
    db = await setupTestDatabase();
    repository = new EcosystemGraphRepository(db);
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
  });

  beforeEach(async () => {
    await resetTestDatabase(db);
    testData = await seedTestData(db);
    testOrgId = testData.orgId;
  });

  it('should fetch all servers in organization', async () => {
    const graph = await orgContext.run(testOrgId, () => repository.getGraph());

    const serverNodes = graph.nodes.filter((n) => n.kind === 'server');

    expect(serverNodes.length).toBeGreaterThanOrEqual(3);
    expect(serverNodes.every((n) => n.kind === 'server')).toBe(true);
  });

  it('should fetch all applications in organization', async () => {
    const graph = await orgContext.run(testOrgId, () => repository.getGraph());

    const appNodes = graph.nodes.filter((n) => n.kind === 'application');

    expect(appNodes.length).toBeGreaterThanOrEqual(2);
    expect(appNodes.every((n) => n.kind === 'application')).toBe(true);
  });

  it('should exclude soft-deleted resources', async () => {
    const serverIds = (await db('servers').where('organization_id', testOrgId).select('id')).map(
      (r: { id: string }) => r.id,
    );
    expect(serverIds.length).toBeGreaterThan(0);
    await db('servers').where('id', serverIds[0]).update({ deleted_at: new Date() });

    const graph = await orgContext.run(testOrgId, () => repository.getGraph());
    const deletedServerInGraph = graph.nodes.find((n) => n.id === serverIds[0]);

    expect(deletedServerInGraph).toBeUndefined();
  });

  it('should return deployments as hosts edges', async () => {
    await db('application_deployments').insert({
      organization_id: testOrgId,
      application_id: testData.appId1,
      server_id: testData.serverId1,
      environment: 'development',
    });

    const graph = await orgContext.run(testOrgId, () => repository.getGraph());

    const hostEdges = graph.edges.filter((e) => e.relationType === 'hosts');

    expect(hostEdges.length).toBeGreaterThan(0);
    expect(hostEdges[0]).toHaveProperty('source');
    expect(hostEdges[0]).toHaveProperty('target');
  });

  it('should return dependencies as dependsOn edges', async () => {
    await db('application_dependencies').insert({
      organization_id: testOrgId,
      application_id: testData.appId1,
      depends_on_application_id: testData.appId2,
    });

    const graph = await orgContext.run(testOrgId, () => repository.getGraph());
    const dependEdges = graph.edges.filter((e) => e.relationType === 'dependsOn');

    expect(dependEdges.length).toBeGreaterThan(0);
  });

  it('should filter out edges with soft-deleted targets', async () => {
    const [deployment] = (await db('application_deployments')
      .insert({
        organization_id: testOrgId,
        application_id: testData.appId1,
        server_id: testData.serverId1,
        environment: 'development',
      })
      .returning(['id'])) as Array<{ id: string }>;

    await db('applications').where('id', testData.appId1).update({ deleted_at: new Date() });

    const graph = await orgContext.run(testOrgId, () => repository.getGraph());
    const stillExists = graph.edges.find((e) => e.id === deployment.id);

    expect(stillExists).toBeUndefined();
  });

  it('should return empty graph for org with no resources', async () => {
    const emptyOrgId = randomUUID();

    const graph = await orgContext.run(emptyOrgId, () => repository.getGraph());

    expect(graph.nodes).toEqual([]);
    expect(graph.edges).toEqual([]);
  });

  it('should handle mixed soft-delete state correctly', async () => {
    const beforeGraph = await orgContext.run(testOrgId, () => repository.getGraph());
    const initialNodes = beforeGraph.nodes.length;

    await db('servers').where('id', testData.serverId1).update({ deleted_at: new Date() });

    const afterGraph = await orgContext.run(testOrgId, () => repository.getGraph());

    expect(afterGraph.nodes.length).toBeLessThan(initialNodes);
  });
});
