import type { Knex } from 'knex';
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';

import { orgContext } from '../../../shared/context/org-context.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { ResourceRelationshipRepository } from '../../resource-graph/infrastructure/resource-relationship.repository.js';
import { DatabaseRepository } from '../infrastructure/database.repository.js';

import { DatabaseService } from './database.service.js';

interface TestContext {
  db: Knex | null;
  databaseService: DatabaseService | null;
  orgId: string;
}

describe('DatabaseService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    databaseService: null,
    orgId: '',
  };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();

    const [org] = (await ctx.db('organizations')
      .insert({
        slug: `test-org-${Date.now()}`,
        name: 'Test Organization',
        plan: 'enterprise',
        metadata: JSON.stringify({}),
      })
      .returning(['id'])) as Array<{ id: string }>;

    ctx.orgId = org.id;
    orgContext.set(ctx.orgId);

    const databaseRepository = new DatabaseRepository(ctx.db);
    const graphRepository = new ResourceRelationshipRepository(ctx.db);
    ctx.databaseService = new DatabaseService(databaseRepository, graphRepository);
  });

  afterEach(async () => {
    if (ctx.db) {
      await resetTestDatabase(ctx.db);
    }
  });

  afterAll(async () => {
    if (ctx.db) {
      await teardownTestDatabase();
    }
  });

  describe('bulkDelete', () => {
    it('should delete multiple databases', async () => {
      const db1 = await ctx.databaseService!.create(
        {
          name: 'test-db-1',
          engine: 'postgres',
          environment: 'dev',
        },
        { actorUserId: 'test-user' },
      );

      const db2 = await ctx.databaseService!.create(
        {
          name: 'test-db-2',
          engine: 'mysql',
          environment: 'prod',
        },
        { actorUserId: 'test-user' },
      );

      const deleted = await ctx.databaseService!.bulkDelete([db1.id, db2.id], {
        actorUserId: 'test-user',
      });

      expect(deleted).toBe(2);

      const remaining = await ctx.databaseService!.list({}, { page: 1, pageSize: 100 });
      expect(remaining.items.filter((db) => [db1.id, db2.id].includes(db.id))).toHaveLength(0);
    });

    it('should handle non-existent IDs gracefully', async () => {
      const fakeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const deleted = await ctx.databaseService!.bulkDelete([fakeId], {
        actorUserId: 'test-user',
      });

      expect(deleted).toBe(0);
    });

    it('should delete only existing databases from mixed list', async () => {
      const db1 = await ctx.databaseService!.create(
        {
          name: 'test-db-mixed-1',
          engine: 'postgres',
          environment: 'dev',
        },
        { actorUserId: 'test-user' },
      );

      const fakeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const deleted = await ctx.databaseService!.bulkDelete([db1.id, fakeId], {
        actorUserId: 'test-user',
      });

      expect(deleted).toBe(1);
    });
  });
});
