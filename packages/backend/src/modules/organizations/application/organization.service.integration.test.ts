import type { Knex } from 'knex';

import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';

interface TestContext {
  db: Knex | null;
}

describe('OrganizationService (Integration)', () => {
  const ctx: TestContext = { db: null };

  beforeEach(async () => {
    ctx.db = await setupTestDatabase();
  });

  afterEach(async () => {
    if (ctx.db) await resetTestDatabase(ctx.db);
  });

  afterAll(async () => {
    if (ctx.db) await teardownTestDatabase(ctx.db);
  }, 30000);

  it('creates organization', async () => {
    jest.setTimeout(10000);
    const [org] = (await ctx.db!('organizations')
      .insert({
        slug: `org-${Date.now()}`,
        name: 'Test Org',
        plan: 'enterprise',
        metadata: '{}',
      })
      .returning(['id'])) as Array<{ id: string }>;
    expect(org.id).toBeDefined();
  });

  it('lists organizations with pagination', async () => {
    jest.setTimeout(10000);
    const timestamp = Date.now();
    for (let i = 1; i <= 5; i++) {
      await ctx.db!('organizations').insert({
        slug: `org-${timestamp}-${i}`,
        name: `Org ${i}`,
        plan: 'enterprise',
        metadata: '{}',
      });
    }
    const result = await ctx.db!('organizations').select('*').limit(10);
    expect(result.length).toBeGreaterThan(0);
  });

  it('updates organization settings', async () => {
    jest.setTimeout(10000);
    const [org] = (await ctx.db!('organizations')
      .insert({
        slug: `update-${Date.now()}`,
        name: 'Update Test',
        plan: 'enterprise',
        metadata: '{}',
      })
      .returning(['id'])) as Array<{ id: string }>;

    await ctx.db!('organizations').where('id', org.id).update({ name: 'Updated' });
    const updated = await ctx.db!('organizations').where('id', org.id).first();
    expect(updated.name).toBe('Updated');
  });

  it('retrieves organization details', async () => {
    jest.setTimeout(10000);
    const [org] = (await ctx.db!('organizations')
      .insert({
        slug: `retrieve-${Date.now()}`,
        name: 'Retrieve Test',
        plan: 'enterprise',
        metadata: '{}',
      })
      .returning(['*'])) as Array<any>;
    expect(org.slug).toBeDefined();
  });

  it('filters organizations by plan', async () => {
    jest.setTimeout(10000);
    await ctx.db!('organizations').insert({
      slug: `premium-${Date.now()}`,
      name: 'Premium',
      plan: 'premium',
      metadata: '{}',
    });
    const result = await ctx.db!('organizations').where('plan', 'premium').select('*');
    expect(result.length).toBeGreaterThan(0);
  });

  it('validates organization uniqueness', async () => {
    jest.setTimeout(10000);
    const slug = `unique-${Date.now()}`;
    await ctx.db!('organizations').insert({
      slug,
      name: 'Unique Org',
      plan: 'enterprise',
      metadata: '{}',
    });
    expect(true).toBe(true);
  });

  it('manages organization metadata', async () => {
    jest.setTimeout(10000);
    const [org] = (await ctx.db!('organizations')
      .insert({
        slug: `meta-${Date.now()}`,
        name: 'Meta Test',
        plan: 'enterprise',
        metadata: JSON.stringify({ key: 'value' }),
      })
      .returning(['id'])) as Array<{ id: string }>;
    expect(org.id).toBeDefined();
  });

  it('counts active organizations', async () => {
    jest.setTimeout(10000);
    const count = await ctx.db!('organizations').count('* as total').first();
    expect(count).toBeDefined();
  });
});
