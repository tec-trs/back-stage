import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // The environments table was created with UNIQUE(slug) globally.
  // After multi-tenancy (migration 041), each org should have its own namespace.
  // Drop the global constraint and create a per-org partial unique index.
  await knex.raw(`ALTER TABLE environments DROP CONSTRAINT IF EXISTS environments_slug_unique`);
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS environments_slug_org_unique_active
    ON environments (slug, organization_id)
    WHERE deleted_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS environments_slug_org_unique_active`);
  await knex.raw(`ALTER TABLE environments ADD CONSTRAINT environments_slug_unique UNIQUE (slug)`);
}
