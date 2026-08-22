# Task 8: Write VIPService Unit Tests

**Files:**
- Create: `packages/backend/src/modules/vips/application/vip.service.test.ts`

**Interfaces:**
- Consumes: `VIPService`, mock factories, mock DB
- Tests: `createVIP()`, `addServerToVIP()`, `removeServerFromVIP()`, `getVIPServers()`

**Context:** VIP is a new feature. Tests verify CRUD operations and relationship management work together.

**From plan — 4 test suites:**

**Suite 1: createVIP**
1. Test: "creates VIP with valid hostname"
   - Mock repository.create → returns VIP
   - Act: service.createVIP(orgId, { hostname: 'vip-01.local' })
   - Assert: result.id set, repository.create called with orgId + data

2. Test: "rejects empty hostname"
   - Act: service.createVIP(orgId, { hostname: '' })
   - Assert: throws ValidationError

**Suite 2: addServerToVIP**
1. Test: "adds server and creates graph relationship"
   - Mock: repository.findById, servers table, vip_servers table, getMembers
   - Act: service.addServerToVIP(vipId, orgId, serverId)
   - Assert: repository.addServer called, resource_relationships.insert called

2. Test: "rejects duplicate server in VIP"
   - Mock: vip_servers.where().first → returns existing member
   - Assert: throws ValidationError

3. Test: "rejects non-existent server"
   - Mock: servers.where().first → null
   - Assert: throws NotFoundError

**Suite 3: removeServerFromVIP**
1. Test: "removes server and deletes graph relationship"
   - Mock: repository.findById, repository.removeServer
   - Act: service.removeServerFromVIP(vipId, orgId, serverId)
   - Assert: repository.removeServer called, resource_relationships updated

**Suite 4: getVIPServers**
1. Test: "returns list of servers in VIP"
   - Mock: repository.getServers → array of servers
   - Act: service.getVIPServers(vipId, orgId)
   - Assert: returns servers array

**Exact structure from plan:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VIPService } from './vip.service';
import { ValidationError, NotFoundError } from '@back-stage/shared';

describe('VIPService', () => {
  let service: VIPService;
  let mockDb: any;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = { /* all methods */ };
    mockDb = { /* table mocks */ };
    service = new VIPService(mockDb);
    service['repository'] = mockRepository;
  });

  // 4 suites here
});
```

**Verification:**
- Run: `cd packages/backend && npm run test -- src/modules/vips/application/vip.service.test.ts`

**Commit message:** "test: add unit tests for VIPService"

**Success criteria:**
- Test file created with 4 test suites (8 total tests)
- Tests CRUD + relationship management
- Uses vi.fn() to mock repository and DB
- Tests cover happy path + validation errors
- Fresh commit
