import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { Knex } from 'knex';
import { GraphRepository } from './graph.repository';
import { setupTestDatabase, resetTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection';
import { seedTestData } from '../../../test-fixtures/seed-data';
import { expectEdgeCount, getEdges } from '../../../test-fixtures/test-utils';

describe('GraphRepository', () => {
  let db: Knex;
  let repository: GraphRepository;
  let testData: any;

  beforeAll(async () => {
    db = await setupTestDatabase();
    repository = new GraphRepository(db);
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
  });

  beforeEach(async () => {
    await resetTestDatabase(db);
    testData = await seedTestData(db);
  });

  describe('getEdgesBySourceId', () => {
    it('should return direct edges from a source', async () => {
      // Arrange: Insert edge server1 → app1 with relation type 'hosts'
      await db('resource_relationships').insert({
        organization_id: testData.orgId,
        source_type: 'server',
        source_id: testData.serverId1,
        target_type: 'application',
        target_id: testData.appId1,
        relation_type: 'hosts',
        metadata: {},
      });

      // Act: Get edges from server1
      const edges = await repository.getEdgesBySourceId(testData.serverId1, testData.orgId);

      // Assert: Should return 1 edge with correct properties
      expect(edges).toHaveLength(1);
      expect(edges[0]).toMatchObject({
        sourceId: testData.serverId1,
        sourceType: 'server',
        targetId: testData.appId1,
        targetType: 'application',
        relationType: 'hosts',
      });
    });

    it('should return empty array when no edges exist from source', async () => {
      // Arrange: No edges inserted
      // (testData seeding creates resources but no relationships)

      // Act: Get edges from server1
      const edges = await repository.getEdgesBySourceId(testData.serverId1, testData.orgId);

      // Assert: Should return empty array
      expect(edges).toHaveLength(0);
      expect(edges).toEqual([]);
    });

    it('should exclude soft-deleted relationships', async () => {
      // Arrange: Insert edge and then soft-delete it
      const [edge] = (await db('resource_relationships')
        .insert({
          organization_id: testData.orgId,
          source_type: 'server',
          source_id: testData.serverId1,
          target_type: 'application',
          target_id: testData.appId1,
          relation_type: 'hosts',
          metadata: {},
        })
        .returning(['id'])) as Array<{ id: string }>;

      // Soft-delete the edge
      await db('resource_relationships')
        .where('id', edge.id)
        .update({ deleted_at: db.fn.now() });

      // Act: Get edges from server1
      const edges = await repository.getEdgesBySourceId(testData.serverId1, testData.orgId);

      // Assert: Should return empty array (soft-deleted filtered out)
      expect(edges).toHaveLength(0);
    });
  });

  describe('getTransitiveClosure', () => {
    it('should traverse chain of edges to find all reachable targets', async () => {
      // Arrange: Create chain server1 → app1 → db1
      // server1 hosts app1
      await db('resource_relationships').insert({
        organization_id: testData.orgId,
        source_type: 'server',
        source_id: testData.serverId1,
        target_type: 'application',
        target_id: testData.appId1,
        relation_type: 'hosts',
        metadata: {},
      });

      // app1 depends_on db1
      await db('resource_relationships').insert({
        organization_id: testData.orgId,
        source_type: 'application',
        source_id: testData.appId1,
        target_type: 'database',
        target_id: testData.dbId,
        relation_type: 'depends_on',
        metadata: {},
      });

      // Act: Get transitive closure from server1
      const closure = await repository.getTransitiveClosure(testData.serverId1, testData.orgId);

      // Assert: Should include both direct edge (server→app) and transitive edge (server→app→db)
      expect(closure.length).toBeGreaterThanOrEqual(2);

      // Check that we have the direct edge
      const directEdge = closure.find((e) => e.targetId === testData.appId1);
      expect(directEdge).toBeDefined();
      expect(directEdge).toMatchObject({
        sourceId: testData.serverId1,
        targetId: testData.appId1,
        relationType: 'hosts',
      });

      // Check that we have the transitive edge (or at least can reach the database)
      const dbReachable = closure.find((e) => e.targetId === testData.dbId);
      expect(dbReachable).toBeDefined();
      expect(dbReachable).toMatchObject({
        targetId: testData.dbId,
        targetType: 'database',
      });
    });

    it('should handle empty graph gracefully', async () => {
      // Arrange: No edges in database

      // Act: Get transitive closure from server1
      const closure = await repository.getTransitiveClosure(testData.serverId1, testData.orgId);

      // Assert: Should return empty array
      expect(closure).toHaveLength(0);
      expect(closure).toEqual([]);
    });

    it('should exclude soft-deleted edges from closure', async () => {
      // Arrange: Create chain but soft-delete the middle edge
      // server1 hosts app1
      const [edge1] = (await db('resource_relationships')
        .insert({
          organization_id: testData.orgId,
          source_type: 'server',
          source_id: testData.serverId1,
          target_type: 'application',
          target_id: testData.appId1,
          relation_type: 'hosts',
          metadata: {},
        })
        .returning(['id'])) as Array<{ id: string }>;

      // app1 depends_on db1
      const [edge2] = (await db('resource_relationships')
        .insert({
          organization_id: testData.orgId,
          source_type: 'application',
          source_id: testData.appId1,
          target_type: 'database',
          target_id: testData.dbId,
          relation_type: 'depends_on',
          metadata: {},
        })
        .returning(['id'])) as Array<{ id: string }>;

      // Soft-delete the middle edge (app1 → db1)
      await db('resource_relationships')
        .where('id', edge2.id)
        .update({ deleted_at: db.fn.now() });

      // Act: Get transitive closure from server1
      const closure = await repository.getTransitiveClosure(testData.serverId1, testData.orgId);

      // Assert: Should only have the first edge, not the database
      // because the app1 → db1 edge is soft-deleted
      const directEdge = closure.find((e) => e.targetId === testData.appId1);
      expect(directEdge).toBeDefined();

      const dbEdge = closure.find((e) => e.targetId === testData.dbId);
      expect(dbEdge).toBeUndefined();
    });
  });
});
