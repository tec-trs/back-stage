import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

// The previous migration (20260901040000) created these tables with camelCase
// columns (organizationId, createdAt...), which doesn't match this project's
// snake_case convention and was never queried by working code (the module that
// used it was written against a different framework and never wired in). The
// tables have no real data, so this drops and recreates them cleanly instead
// of a column-by-column rename.
const REGISTRATIONS_TABLE = 'relationship_registrations';
const RELATIONSHIPS_TABLE = 'registered_relationships';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(RELATIONSHIPS_TABLE);
  await knex.schema.dropTableIfExists(REGISTRATIONS_TABLE);

  await knex.schema.createTable(REGISTRATIONS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();

    addTimestamps(knex, table);

    table.index(['organization_id'], 'relationship_registrations_org_id_index');
  });

  await addPartialUniqueIndex(
    knex,
    REGISTRATIONS_TABLE,
    ['organization_id', 'lower(name)'],
    'relationship_registrations_org_name_unique_active',
  );
  await attachUpdatedAtTrigger(knex, REGISTRATIONS_TABLE);

  await knex.schema.createTable(RELATIONSHIPS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table
      .uuid('registration_id')
      .notNullable()
      .references('id')
      .inTable(REGISTRATIONS_TABLE)
      .onDelete('CASCADE');
    table.string('source_type', 50).notNullable();
    table.uuid('source_id').notNullable();
    table.string('source_label', 255).notNullable();
    table.string('target_type', 50).notNullable();
    table.uuid('target_id').notNullable();
    table.string('target_label', 255).notNullable();
    table.string('relation_type', 50).notNullable();
    table.text('reason').nullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    table.index(['registration_id'], 'registered_relationships_registration_id_index');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(RELATIONSHIPS_TABLE);
  await detachUpdatedAtTrigger(knex, REGISTRATIONS_TABLE);
  await knex.schema.dropTableIfExists(REGISTRATIONS_TABLE);
}
