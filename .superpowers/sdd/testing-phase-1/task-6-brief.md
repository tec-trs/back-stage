# Task 6: Write Integration Test (Critical Flow)

**Files:**
- Modify: `packages/backend/src/app.integration.test.ts`

**Interfaces:**
- Consumes: Express app, test database (Task 2 fixtures)
- Tests end-to-end: POST /vips → GET /resource-graph → POST /simulate-impact

**Context:** Integration tests verify multiple modules work together. Tests happy path: create VIP, add servers, run impact simulation.

**From plan — exact 2 test cases to add:**

1. **Test: Create VIP, add servers, simulate impact**
   ```
   - POST /api/vips with hostname
   - Assert: Status 201, get vipId
   - POST /api/vips/:id/servers with serverId
   - GET /api/resource-graph
   - Assert: vipNode in graph
   - POST /api/resource-graph/simulate-impact with vip resource
   - Assert: impactedResources contains serverId
   ```

2. **Test: Delete VIP cascades soft-delete**
   ```
   - Create VIP + add server
   - DELETE /api/vips/:id
   - Assert: Status 204
   - GET /api/resource-graph
   - Assert: vipNode NOT in graph (soft-deleted)
   ```

**Exact structure from plan:**
```typescript
describe('Integration: Create VIP and Simulate Impact', () => {
  let app: Express;
  let db: Knex;
  let testData: any;
  let token: string;

  beforeAll(async () => {
    db = await setupTestDatabase();
    app = createApp(db);
    token = 'Bearer ' + ...;
  });

  // 2 tests here
});
```

**Verification:**
- Run: `cd packages/backend && npm run test -- src/app.integration.test.ts`

**Commit message:** "test: add integration tests for VIP creation and impact simulation"

**Success criteria:**
- 2 integration test cases added
- Tests use real Express app instance
- Tests verify full flow: create → list → impact
- Uses test fixtures (db, seed data)
- Fresh commit
