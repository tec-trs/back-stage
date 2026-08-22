# Task 3: EcosystemGraphRepository Integration Tests - Report

## Status: DONE

## Important note: task brief code was adapted, not transcribed verbatim

The task brief's "exact code" assumed fixture APIs that do not exist in this codebase. Investigation of
`packages/backend/src/test-fixtures/db-connection.ts`, `seed-data.ts`, and
`packages/backend/src/shared/context/org-context.ts`, plus a working precedent test
(`packages/backend/src/modules/resource-graph/infrastructure/graph.repository.test.ts`), showed the following
mismatches, which were corrected:

- `getDatabase()` / `../../../shared/context/db-context.js` does not exist. `setupTestDatabase()` (no args)
  itself returns the `Knex` instance — used directly instead.
- `resetTestDatabase()` and `teardownTestDatabase()` both require the `db: Knex` argument in this codebase
  (`resetTestDatabase(db)`, `teardownTestDatabase(db)`), not zero-arg calls.
- `seedTestData()` requires `db: Knex` as an argument (`seedTestData(db)`) and returns a full `TestDataIds`
  object (`orgId`, `serverId1-3`, `appId1-2`, `dbId`), not just `{ orgId }`.
- `orgContext` has no `.set()` / `.clear()` methods. The real API is
  `orgContext.run<T>(organizationId, fn): T`, `orgContext.get()`, `orgContext.getOrThrow()` (AsyncLocalStorage-based).
  Since `EcosystemGraphRepository.getGraph()` reads org id via `orgContext.getOrThrow()` internally, each call
  is wrapped as `await orgContext.run(testOrgId, () => repository.getGraph())` — this scopes org context per
  call with no manual clearing needed (no leakage risk between tests).
- `application_dependencies.id` is a `uuid` column defaulting to `gen_random_uuid()`, and the table has no
  `updated_at` column — the brief's insert (`id: 'dep-test-...'`, `updated_at: new Date()`) would fail against
  the real schema (invalid UUID literal / unknown column). Removed both fields and let Postgres generate the id.
- `seedTestData` does not create any `application_deployments` rows, so the brief's "hosts edges" and
  "soft-deleted target" tests (which assumed a pre-existing hosts edge) would find nothing. Added explicit
  `application_deployments` inserts in those two tests.
- The brief's "empty org" test used `test-org-empty-${Date.now()}` as an org id, which is not a valid UUID —
  `organization_id` columns are `uuid` typed, so Postgres would reject the filter with an invalid-UUID error.
  Replaced with `randomUUID()` from `node:crypto`.
- Adopted the repo's established `beforeAll`/`afterAll` (connect/destroy once) + `beforeEach` (reset + reseed)
  pattern, matching `graph.repository.test.ts`, instead of reconnecting to Postgres in every `beforeEach`/`afterEach`.

All 8 test names, assertions, and intent from the brief were preserved; only the setup/insert plumbing was
adapted to match the real fixture and schema contracts.

## Test file

`packages/backend/src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts`

## Test Execution

### Command
```bash
cd packages/backend && npm run test -- src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts
```

### Output (no local PostgreSQL available — expected)
```
❯ src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts (8 tests | 8 skipped) 155ms

 FAIL  src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts > EcosystemGraphRepository
error: autenticação do tipo senha falhou para o usuário "postgres"
 ❯ parseErrorMessage ../../node_modules/pg-protocol/src/parser.ts:395:9
 ...

 FAIL  src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts > EcosystemGraphRepository
TypeError: Cannot read properties of undefined (reading 'destroy')
 ❯ Module.teardownTestDatabase src/test-fixtures/db-connection.ts:31:12

 Test Files  1 failed (1)
      Tests  8 skipped (8)
```

All 8 tests report as **skipped** (Postgres auth/connection failure in `beforeAll` causes Vitest to skip the
individual `it` blocks). The `afterAll` then throws `TypeError: Cannot read properties of undefined (reading
'destroy')` because `db` was never assigned, which makes the suite exit non-zero despite the tests themselves
skipping cleanly.

**This is not a defect in the new test file** — it is pre-existing behavior of this codebase's DB-fixture
pattern. Running the existing, already-merged precedent test
(`src/modules/resource-graph/infrastructure/graph.repository.test.ts`) against the same local environment
produces byte-for-byte the same failure signature (6 tests, 6 skipped, same `teardownTestDatabase` TypeError).
Confirmed via direct side-by-side run.

### TypeScript
`npx tsc --noEmit -p .` shows no errors introduced by the new file (two pre-existing, unrelated errors remain
in `20260101000057_add_vip_and_group_to_resource_relationships.ts` and `auth.service.ts`).

### Lint
`npx eslint src/modules/ecosystem/infrastructure/ecosystem-graph.repository.test.ts` — clean, no errors
(one `import/order` issue was found and fixed: `Knex` type import reordered before the `vitest` import).

## All Test Names

1. should fetch all servers in organization
2. should fetch all applications in organization
3. should exclude soft-deleted resources
4. should return deployments as hosts edges
5. should return dependencies as dependsOn edges
6. should filter out edges with soft-deleted targets
7. should return empty graph for org with no resources
8. should handle mixed soft-delete state correctly

## Coverage

Not measured — PostgreSQL is unavailable in this local environment, so the repository code paths under test
cannot execute here. Per task instructions this is expected; coverage should be verified in CI where the
PostgreSQL service is configured. Given the test file exercises `getGraph()` end-to-end (servers, applications,
soft-delete filtering, hosts edges, dependsOn edges, edge-target soft-delete filtering, org isolation), it is
expected to comfortably clear the 75%+ repository threshold once run against a live database.

## Commit

```
2384f46  test: add integration tests for EcosystemGraphRepository (8 tests)
1 file changed, 131 insertions(+)
```

## Concerns

- Skipped tests due to no local PostgreSQL are expected and OK per task instructions.
- The non-zero exit / "Failed Suites" status when Postgres is unavailable is a pre-existing characteristic of
  `test-fixtures/db-connection.ts` (`teardownTestDatabase` unconditionally calls `db.destroy()` in `afterAll`
  even if `db` was never assigned because `beforeAll` threw). It affects the existing precedent test the same
  way, so it was not "fixed" here to avoid diverging from the established fixture contract — flagging it in
  case a future task wants to harden `db-connection.ts` itself (e.g. guard `teardownTestDatabase` with an
  `if (db)` check, or guard `beforeAll`/`afterAll` with a Postgres-availability probe that skips the whole
  suite cleanly).
- Could not verify the 8 tests actually pass against a live database in this environment — that verification
  should happen in CI where the PostgreSQL service is configured, per the task's own expectations.
