import type { Knex } from 'knex';

// Tables that need organization isolation.
// Reference tables (server_types, application_types, database_engines, url_types) stay global.
const RESOURCE_TABLES = [
  'servers',
  'server_disks',
  'applications',
  'application_deployments',
  'application_dependencies',
  'databases',
  'urls',
  'resource_relationships',
  'environments',
  'teams',
  'team_members',
  'catalog_entities',
  'catalog_entity_relations',
  'deployments',
  'governance_policies',
  'governance_policy_evaluations',
  'compliance_checks',
  'compliance_findings',
  'governance_policy_exemptions',
  'audit_logs',
] as const;

export async function up(knex: Knex): Promise<void> {
  const defaultOrg = await knex('organizations').where({ slug: 'default' }).first();
  if (!defaultOrg) {
    throw new Error('Default organization not found. Run migration 000039 first.');
  }
  const defaultOrgId: string = defaultOrg.id;

  for (const table of RESOURCE_TABLES) {
    const exists = await knex.schema.hasTable(table);
    if (!exists) continue;

    const hasColumn = await knex.schema.hasColumn(table, 'organization_id');
    if (hasColumn) continue;

    // Step 1: add nullable column
    await knex.schema.alterTable(table, (t) => {
      t.uuid('organization_id').nullable().references('id').inTable('organizations').onDelete('RESTRICT');
    });

    // Step 2: backfill with default org
    await knex(table).update({ organization_id: defaultOrgId });

    // Step 3: make NOT NULL
    await knex.raw(`ALTER TABLE ${table} ALTER COLUMN organization_id SET NOT NULL`);

    // Step 4: index for query performance
    await knex.raw(`CREATE INDEX idx_${table}_org ON ${table}(organization_id)`);
  }

  // Drop the old single-column unique indexes that are now per-org
  await knex.raw(`DROP INDEX IF EXISTS servers_hostname_unique_active`);
  await knex.raw(`
    CREATE UNIQUE INDEX servers_hostname_unique_active
    ON servers (hostname, organization_id)
    WHERE deleted_at IS NULL
  `);

  await knex.raw(`DROP INDEX IF EXISTS applications_code_unique_active`);
  await knex.raw(`
    CREATE UNIQUE INDEX applications_code_unique_active
    ON applications (code, organization_id)
    WHERE deleted_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  for (const table of RESOURCE_TABLES) {
    const exists = await knex.schema.hasTable(table);
    if (!exists) continue;
    const hasColumn = await knex.schema.hasColumn(table, 'organization_id');
    if (!hasColumn) continue;
    await knex.raw(`DROP INDEX IF EXISTS idx_${table}_org`);
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn('organization_id');
    });
  }

  // Restore original hostname unique index
  await knex.raw(`DROP INDEX IF EXISTS servers_hostname_unique_active`);
  await knex.raw(`
    CREATE UNIQUE INDEX servers_hostname_unique_active
    ON servers (hostname)
    WHERE deleted_at IS NULL
  `);

  await knex.raw(`DROP INDEX IF EXISTS applications_code_unique_active`);
  await knex.raw(`
    CREATE UNIQUE INDEX applications_code_unique_active
    ON applications (code)
    WHERE deleted_at IS NULL
  `);
}
