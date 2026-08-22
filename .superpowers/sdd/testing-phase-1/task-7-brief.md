# Task 7: Write AuthService Unit Tests (JWT + RBAC)

**Files:**
- Create: `packages/backend/src/modules/auth/application/auth.service.test.ts`

**Interfaces:**
- Consumes: `AuthService` from auth.service.ts, mock factories
- Tests: `login()`, `validateToken()`, `hasPermission()`

**Context:** Auth is security-sensitive. Tests verify JWT validation, role-based access, and permission checks.

**From plan — 3 test suites:**

**Suite 1: login**
1. Test: "returns JWT token for valid credentials"
   - Mock user with bcrypt hash
   - Mock bcryptjs.compare → true
   - Act: service.login('admin', 'password123')
   - Assert: result.token defined, user.id and user.role correct

2. Test: "throws UnauthorizedError for incorrect password"
   - Mock user exists, bcryptjs.compare → false
   - Assert: throws UnauthorizedError

3. Test: "throws UnauthorizedError for non-existent user"
   - Mock userRepository.findByCode → null
   - Assert: throws UnauthorizedError

**Suite 2: validateToken**
1. Test: "decodes and returns user from valid JWT"
   - Mock jsonwebtoken.verify → { id: 'user-1', role: 'admin' }
   - Act: service.validateToken(token)
   - Assert: decoded.id and decoded.role correct

2. Test: "throws UnauthorizedError for invalid JWT"
   - Mock jsonwebtoken.verify → throws Error
   - Assert: throws UnauthorizedError

**Suite 3: hasPermission**
1. Test: "grants admin access to all resources"
   - User with role 'admin'
   - Assert: hasPermission(user, 'delete_server') → true

2. Test: "grants maintainer write but not delete"
   - User with role 'maintainer'
   - Assert: create_server → true, delete_server → false

3. Test: "grants viewer read-only access"
   - User with role 'viewer'
   - Assert: read_server → true, create_server → false

**Exact structure from plan:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import { UnauthorizedError } from '@back-stage/shared';

describe('AuthService', () => {
  let service: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    mockUserRepository = {
      findByCode: vi.fn(),
    };
    service = new AuthService(mockUserRepository);
  });

  // 3 suites here
});
```

**Verification:**
- Run: `cd packages/backend && npm run test -- src/modules/auth/application/auth.service.test.ts`

**Commit message:** "test: add unit tests for AuthService (JWT + RBAC)"

**Success criteria:**
- Test file created with 3 suites (login, validateToken, hasPermission)
- Uses vi.fn() to mock userRepository, bcryptjs, jsonwebtoken
- Tests cover happy path + error cases
- All 3 roles tested (admin, maintainer, viewer)
- Fresh commit
