import { ConflictError, ValidationError } from '@back-stage/shared';
import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';
import { resetTestDatabase, setupTestDatabase, teardownTestDatabase } from '../../../test-fixtures/db-connection.js';
import { PolicyRepository } from '../infrastructure/policy.repository.js';

import { PolicyService } from './policy.service.js';

interface TestContext {
  db: Knex | null;
  policyService: PolicyService | null;
  orgId: string;
}

describe('PolicyService (Integration)', () => {
  const ctx: TestContext = {
    db: null,
    policyService: null,
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

    // Initialize PolicyService with real database
    const policyRepository = new PolicyRepository(ctx.db);
    ctx.policyService = new PolicyService(policyRepository);
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

  it('creates policy and validates definition', async () => {
    // Increase timeout for integration test
    jest.setTimeout(10000);
    // Setup: Policy input with valid definition
    const policyInput = {
      name: 'Production Requires Owner',
      slug: `prod-owner-${Date.now()}`,
      policyType: 'quality',
      definition: JSON.stringify({
        rules: [
          { field: 'environment', operator: 'equals', value: 'production' },
          { field: 'ownerTeamId', operator: 'equals', value: 'required' },
        ],
        combinator: 'AND',
      }),
    };

    // Act: Create policy in organization context
    const policy = await orgContext.run(ctx.orgId, async () =>
      ctx.policyService!.create(policyInput, { actorUserId: 'test-user' })
    );

    // Assert: Policy created successfully with correct properties
    expect(policy).toBeDefined();
    expect(policy.id).toBeDefined();
    expect(policy.name).toBe('Production Requires Owner');
    expect(policy.slug).toBe(policyInput.slug);
    expect(policy.policyType).toBe('quality');
    expect(policy.isActive).toBe(true);

    // Verify definition is stored correctly
    const parsed = JSON.parse(policy.definition);
    expect(parsed.rules).toHaveLength(2);
    expect(parsed.combinator).toBe('AND');

    // Verify policy persisted in database
    const retrievedPolicy = await orgContext.run(ctx.orgId, async () =>
      ctx.policyService!.getById(policy.id)
    );
    expect(retrievedPolicy).toBeDefined();
    expect(retrievedPolicy.name).toBe('Production Requires Owner');
    expect(retrievedPolicy.slug).toBe(policyInput.slug);
  });

  it('rejects policy with invalid JSON definition', async () => {
    // Increase timeout for integration test
    jest.setTimeout(10000);
    // Setup: Policy input with invalid JSON definition
    const policyInput = {
      name: 'Invalid Policy',
      slug: `invalid-policy-${Date.now()}`,
      policyType: 'quality',
      definition: 'not-valid-json-{broken', // Invalid JSON
    };

    // Act & Assert: Expect ValidationError to be thrown
    await expect(
      orgContext.run(ctx.orgId, async () =>
        ctx.policyService!.create(policyInput, { actorUserId: 'test-user' })
      )
    ).rejects.toThrow(ValidationError);

    // Verify error message mentions JSON issue
    try {
      await orgContext.run(ctx.orgId, async () =>
        ctx.policyService!.create(policyInput, { actorUserId: 'test-user' })
      );
    } catch (error) {
      if (error instanceof ValidationError) {
        expect(error.message).toContain('JSON malformado');
      }
    }

    // Verify policy was NOT created in database
    const allPolicies = await orgContext.run(ctx.orgId, async () =>
      ctx.policyService!.list({}, { page: 1, pageSize: 10 })
    );
    expect(allPolicies.items).toHaveLength(0);
  });

  it('prevents creating policy with duplicate slug', async () => {
    // Increase timeout for integration test
    jest.setTimeout(10000);
    // Setup: Create first policy with unique slug
    const slug = `prod-owner-unique-${Date.now()}`;
    const firstPolicy = {
      name: 'Production Requires Owner',
      slug,
      policyType: 'quality',
      definition: JSON.stringify({
        rules: [{ field: 'environment', operator: 'equals', value: 'production' }],
        combinator: 'AND',
      }),
    };

    // Create first policy (should succeed)
    const createdPolicy = await orgContext.run(ctx.orgId, async () =>
      ctx.policyService!.create(firstPolicy, { actorUserId: 'test-user' })
    );
    expect(createdPolicy).toBeDefined();

    // Setup: Second policy with same slug but different name
    const secondPolicy = {
      name: 'Different Name',
      slug, // Same slug
      policyType: 'security',
      definition: JSON.stringify({
        rules: [],
        combinator: 'AND',
      }),
    };

    // Act & Assert: Try to create second policy with same slug (should fail)
    await expect(
      orgContext.run(ctx.orgId, async () =>
        ctx.policyService!.create(secondPolicy, { actorUserId: 'test-user' })
      )
    ).rejects.toThrow(ConflictError);

    // Verify error message mentions slug conflict
    try {
      await orgContext.run(ctx.orgId, async () =>
        ctx.policyService!.create(secondPolicy, { actorUserId: 'test-user' })
      );
    } catch (error) {
      if (error instanceof ConflictError) {
        expect(error.message).toContain('slug');
      }
    }

    // Verify only first policy exists in database
    const allPolicies = await orgContext.run(ctx.orgId, async () =>
      ctx.policyService!.list({}, { page: 1, pageSize: 10 })
    );
    expect(allPolicies.items).toHaveLength(1);
    expect(allPolicies.items[0].name).toBe('Production Requires Owner');
  });
});
