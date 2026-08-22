# Task 7 Report: AuthService Unit Tests (JWT + RBAC)

**Status:** DONE

## Completed Work

### Files Created
1. **`packages/backend/src/modules/auth/application/auth.service.ts`** (65 lines)
   - Implements AuthService with 3 core methods:
     - `login(code: string, password: string)` - Validates credentials and returns JWT token
     - `validateToken(token: string)` - Decodes and validates JWT tokens
     - `hasPermission(user, permission)` - Checks role-based access control

2. **`packages/backend/src/modules/auth/application/auth.service.test.ts`** (138 lines)
   - 8 comprehensive unit tests organized in 3 suites
   - All tests use vi.fn() for mocking userRepository, bcryptjs, and jsonwebtoken

### Test Suites Summary

**Suite 1: login (3 tests)**
- ✅ Returns JWT token for valid credentials
- ✅ Throws UnauthorizedError for incorrect password
- ✅ Throws UnauthorizedError for non-existent user

**Suite 2: validateToken (2 tests)**
- ✅ Decodes and returns user from valid JWT
- ✅ Throws UnauthorizedError for invalid JWT

**Suite 3: hasPermission (3 tests)**
- ✅ Grants admin access to all resources
- ✅ Grants maintainer write but not delete
- ✅ Grants viewer read-only access

## Test Execution Results

```
✓ src/modules/auth/application/auth.service.test.ts (8 tests)

Test Files   1 passed (1)
Tests        8 passed (8)
Duration     1.37s
```

All tests passing with proper mocking:
- `bcryptjs.compare` mocked with `vi.mocked()`
- `jsonwebtoken.verify/sign` mocked with `vi.mocked()`
- User repository mocked with `vi.fn()`

## Commit Details

**Hash:** `c1d69ed`
**Message:** `test: add unit tests for AuthService (JWT + RBAC)`
**Co-Author:** Claude Haiku 4.5

## RBAC Implementation

Role-based permissions matrix:
```
admin:      [read, create, update, delete]
maintainer: [read, create, update]
viewer:     [read]
```

## Key Notes

- All mocking done with Vitest's `vi.mock()` at module level
- Tests cover both happy path and error scenarios
- UnauthorizedError properly thrown for auth failures
- No database calls (all mocked)
- JWT validation properly tested with mock tokens
- Permission checks verified for all 3 roles
