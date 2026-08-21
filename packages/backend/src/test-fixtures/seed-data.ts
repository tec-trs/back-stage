import type { Knex } from 'knex';

export interface TestDataIds {
  orgId: string;
  serverId1: string;
  serverId2: string;
  serverId3: string;
  appId1: string;
  appId2: string;
  dbId: string;
}

export async function seedTestData(db: Knex): Promise<TestDataIds> {
  // Create test organization
  const [org] = (await db('organizations')
    .insert({
      slug: 'test-org',
      name: 'Test Organization',
      plan: 'enterprise',
      metadata: JSON.stringify({}),
    })
    .returning(['id'])) as Array<{ id: string }>;

  const orgId = org.id;

  // Create 3 test servers
  const [server1] = (await db('servers')
    .insert({
      organization_id: orgId,
      hostname: 'test-server-1',
      display_name: 'Test Server 1',
      description: 'First test server',
      server_type: 'vm',
      provider: 'on_premise',
      environment: 'development',
      status: 'active',
      private_ips: ['192.168.1.100'],
      metadata: JSON.stringify({}),
    })
    .returning(['id'])) as Array<{ id: string }>;

  const [server2] = (await db('servers')
    .insert({
      organization_id: orgId,
      hostname: 'test-server-2',
      display_name: 'Test Server 2',
      description: 'Second test server',
      server_type: 'vm',
      provider: 'on_premise',
      environment: 'development',
      status: 'active',
      private_ips: ['192.168.1.101'],
      metadata: JSON.stringify({}),
    })
    .returning(['id'])) as Array<{ id: string }>;

  const [server3] = (await db('servers')
    .insert({
      organization_id: orgId,
      hostname: 'test-server-3',
      display_name: 'Test Server 3',
      description: 'Third test server',
      server_type: 'bare_metal',
      provider: 'on_premise',
      environment: 'development',
      status: 'active',
      private_ips: ['192.168.1.102'],
      metadata: JSON.stringify({}),
    })
    .returning(['id'])) as Array<{ id: string }>;

  // Create 2 test applications
  const [app1] = (await db('applications')
    .insert({
      organization_id: orgId,
      code: 'test-app-1',
      display_name: 'Test Application 1',
      description: 'First test application',
      app_type: 'web_app',
      criticality: 'medium',
      status: 'active',
      metadata: JSON.stringify({}),
    })
    .returning(['id'])) as Array<{ id: string }>;

  const [app2] = (await db('applications')
    .insert({
      organization_id: orgId,
      code: 'test-app-2',
      display_name: 'Test Application 2',
      description: 'Second test application',
      app_type: 'microservice',
      criticality: 'low',
      status: 'active',
      metadata: JSON.stringify({}),
    })
    .returning(['id'])) as Array<{ id: string }>;

  // Create 1 test database
  const [database] = (await db('databases')
    .insert({
      organization_id: orgId,
      name: 'test-postgres',
      display_name: 'Test PostgreSQL Database',
      description: 'Test PostgreSQL database instance',
      engine: 'postgresql',
      version: '14.0',
      criticality: 'medium',
      environment: 'development',
      status: 'active',
      metadata: JSON.stringify({}),
    })
    .returning(['id'])) as Array<{ id: string }>;

  return {
    orgId,
    serverId1: server1.id,
    serverId2: server2.id,
    serverId3: server3.id,
    appId1: app1.id,
    appId2: app2.id,
    dbId: database.id,
  };
}
