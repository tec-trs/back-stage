import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'catalog_entities';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('kind', 50).notNullable();
    table.string('type', 100).notNullable();
    table.string('name', 255).notNullable();
    table.string('namespace', 255).notNullable().defaultTo('default');
    table.string('title', 255).nullable();
    table.text('description').nullable();
    table.string('lifecycle', 50).notNullable().defaultTo('experimental');
    table.uuid('owner_team_id').nullable().references('id').inTable('teams').onDelete('SET NULL');
    table.uuid('system_id').nullable().references('id').inTable(TABLE_NAME).onDelete('SET NULL');
    table.string('repository_url', 2048).nullable();
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['kind'], 'catalog_entities_kind_index');
    table.index(['owner_team_id'], 'catalog_entities_owner_team_id_index');
    table.index(['system_id'], 'catalog_entities_system_id_index');
    table.check(
      "kind in ('component', 'api', 'resource', 'system', 'domain')",
      [],
      'catalog_entities_kind_check',
    );
    table.check(
      "lifecycle in ('experimental', 'production', 'deprecated')",
      [],
      'catalog_entities_lifecycle_check',
    );
  });

  await addPartialUniqueIndex(
    knex,
    TABLE_NAME,
    ['namespace', 'kind', 'name'],
    'catalog_entities_namespace_kind_name_unique_active',
  );
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
