import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Drop existing check constraints
  await knex.raw(`
    ALTER TABLE resource_relationships
    DROP CONSTRAINT IF EXISTS resource_relationships_source_type_check
  `);

  await knex.raw(`
    ALTER TABLE resource_relationships
    DROP CONSTRAINT IF EXISTS resource_relationships_target_type_check
  `);

  // Add new constraints that include 'group'
  await knex.raw(`
    ALTER TABLE resource_relationships
    ADD CONSTRAINT resource_relationships_source_type_check
    CHECK (source_type in ('server', 'application', 'database', 'url', 'group'))
  `);

  await knex.raw(`
    ALTER TABLE resource_relationships
    ADD CONSTRAINT resource_relationships_target_type_check
    CHECK (target_type in ('server', 'application', 'database', 'url', 'group'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Revert to original constraints
  await knex.raw(`
    ALTER TABLE resource_relationships
    DROP CONSTRAINT IF EXISTS resource_relationships_source_type_check
  `);

  await knex.raw(`
    ALTER TABLE resource_relationships
    DROP CONSTRAINT IF EXISTS resource_relationships_target_type_check
  `);

  await knex.raw(`
    ALTER TABLE resource_relationships
    ADD CONSTRAINT resource_relationships_source_type_check
    CHECK (source_type in ('server', 'application', 'database', 'url'))
  `);

  await knex.raw(`
    ALTER TABLE resource_relationships
    ADD CONSTRAINT resource_relationships_target_type_check
    CHECK (target_type in ('server', 'application', 'database', 'url'))
  `);
}
