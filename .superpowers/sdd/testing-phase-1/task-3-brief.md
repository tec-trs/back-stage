# Task 3: Create Mock Factories

**Files:**
- Create: `packages/backend/src/test-fixtures/mock-factories.ts`

**Interfaces:**
- Produces:
  - `createMockServer(overrides?: Partial<Server>): Server`
  - `createMockApplication(overrides?: Partial<Application>): Application`
  - `createMockDatabase(overrides?: Partial<Database>): Database`
  - `createMockVIP(overrides?: Partial<VIP>): VIP`
  - `createMockEdge(overrides?: Partial<Edge>): Edge`
  - `createMockEdges(count: number, overrides?: Partial<Edge>): Edge[]`

**Context:** Factories reduce boilerplate in unit tests. Each returns valid defaults that tests can override.

**From plan — exact code for single file:**

```typescript
import { randomUUID } from 'crypto';

export interface Server {
  id: string;
  hostname: string;
  server_type: string;
  provider: string;
  status: string;
  environment: string;
  organization_id: string;
}

export interface Application {
  id: string;
  code: string;
  display_name: string;
  app_type: string;
  organization_id: string;
}

export interface Database {
  id: string;
  name: string;
  engine: string;
  version?: string;
  environment: string;
  criticality: string;
  status: string;
  organization_id: string;
}

export interface VIP {
  id: string;
  hostname: string;
  virtual_ip?: string;
  organization_id: string;
}

export interface Edge {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  relation_type: string;
  organization_id: string;
}

export function createMockServer(overrides?: Partial<Server>): Server {
  return {
    id: randomUUID(),
    hostname: `test-server-${randomUUID().slice(0, 8)}`,
    server_type: 'physical',
    provider: 'on_premise',
    status: 'active',
    environment: 'production',
    organization_id: randomUUID(),
    ...overrides,
  };
}

export function createMockApplication(overrides?: Partial<Application>): Application {
  return {
    id: randomUUID(),
    code: `app-${randomUUID().slice(0, 8)}`,
    display_name: 'Test Application',
    app_type: 'middleware',
    organization_id: randomUUID(),
    ...overrides,
  };
}

export function createMockDatabase(overrides?: Partial<Database>): Database {
  return {
    id: randomUUID(),
    name: `db-${randomUUID().slice(0, 8)}`,
    engine: 'postgres',
    version: '16.0',
    environment: 'production',
    criticality: 'high',
    status: 'active',
    organization_id: randomUUID(),
    ...overrides,
  };
}

export function createMockVIP(overrides?: Partial<VIP>): VIP {
  return {
    id: randomUUID(),
    hostname: `vip-${randomUUID().slice(0, 8)}.local`,
    virtual_ip: '192.168.1.100',
    organization_id: randomUUID(),
    ...overrides,
  };
}

export function createMockEdge(overrides?: Partial<Edge>): Edge {
  return {
    id: randomUUID(),
    source_type: 'server',
    source_id: randomUUID(),
    target_type: 'application',
    target_id: randomUUID(),
    relation_type: 'hosts',
    organization_id: randomUUID(),
    ...overrides,
  };
}

export function createMockEdges(count: number, overrides?: Partial<Edge>): Edge[] {
  return Array.from({ length: count }, (_, i) => 
    createMockEdge({
      ...overrides,
      id: `edge-${i}`,
    })
  );
}
```

**Verification:**
- File created: `packages/backend/src/test-fixtures/mock-factories.ts`
- Run: `cd packages/backend && npx tsx -e "import { createMockServer } from './src/test-fixtures/mock-factories'; const s = createMockServer(); console.log('Server:', s.hostname); console.log('Has ID:', !!s.id);"`
- Expected output: Shows server hostname and "Has ID: true"

**Commit message:** "test: add mock factories for test data generation"

**Success criteria:**
- Single file created with all factory functions
- All functions exported (named exports)
- Each factory accepts optional `overrides`
- Uses `randomUUID()` for unique IDs
- Fresh git commit
