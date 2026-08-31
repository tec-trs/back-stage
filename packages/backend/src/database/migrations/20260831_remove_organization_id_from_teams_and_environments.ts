import type { Knex } from 'knex';

// Migration 20260101000041 (add_organization_id_to_resource_tables) added
// organization_id to a broad list of "resource" tables that need per-tenant
// isolation. `environments` and `teams` (and, by extension, `team_members`)
// were swept into that list by mistake: they were originally created as
// shared reference/taxonomy tables — same as server_types, application_types,
// database_engines and url_types, which that same migration's own comment
// explicitly calls out as staying global — with plain, non-org-scoped unique
// indexes on `teams.slug` and `environments.slug`. Migration 41 backfilled
// organization_id onto them but never updated those unique indexes to be
// per-organization, leaving the tables in an inconsistent state: queries
// filtered by organization_id, but uniqueness was still enforced globally.
// In practice this meant every organization other than the one that owned
// the backfilled rows saw an empty list, since environments/teams/team
// membership are meant to be the same catalog for every organization in
// this CMDB, not duplicated per tenant.
//
// This migration removes organization_id from all three tables, restoring
// them to shared/global reference data.
const TABLES = ['environments', 'teams', 'team_members'] as const;

export async function up(knex: Knex): Promise<void> {
  for (const table of TABLES) {
    const exists = await knex.schema.hasTable(table);
    if (!exists) continue;

    const hasColumn = await knex.schema.hasColumn(table, 'organization_id');
    if (!hasColumn) continue;

    await knex.raw(`DROP INDEX IF EXISTS idx_${table}_org`);
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn('organization_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const defaultOrg = await knex('organizations').where({ slug: 'default' }).first();
  if (!defaultOrg) {
    throw new Error('Default organization not found.');
  }
  const defaultOrgId: string = defaultOrg.id;

  for (const table of TABLES) {
    const exists = await knex.schema.hasTable(table);
    if (!exists) continue;

    const hasColumn = await knex.schema.hasColumn(table, 'organization_id');
    if (hasColumn) continue;

    await knex.schema.alterTable(table, (t) => {
      t.uuid('organization_id').nullable().references('id').inTable('organizations').onDelete('RESTRICT');
    });
    await knex(table).update({ organization_id: defaultOrgId });
    await knex.raw(`ALTER TABLE ${table} ALTER COLUMN organization_id SET NOT NULL`);
    await knex.raw(`CREATE INDEX idx_${table}_org ON ${table}(organization_id)`);
  }
}
