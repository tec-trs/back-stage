import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'catalog_entity_relations';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('source_entity_id')
      .notNullable()
      .references('id')
      .inTable('catalog_entities')
      .onDelete('CASCADE');
    table
      .uuid('target_entity_id')
      .notNullable()
      .references('id')
      .inTable('catalog_entities')
      .onDelete('CASCADE');
    table.string('relation_type', 50).notNullable();
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['source_entity_id'], 'catalog_entity_relations_source_index');
    table.index(['target_entity_id'], 'catalog_entity_relations_target_index');
    table.check(
      "relation_type in ('dependsOn', 'dependencyOf', 'partOf', 'hasPart', 'providesApi', 'consumesApi')",
      [],
      'catalog_entity_relations_type_check',
    );
    table.check(
      'source_entity_id <> target_entity_id',
      [],
      'catalog_entity_relations_no_self_reference_check',
    );
  });

  await addPartialUniqueIndex(
    knex,
    TABLE_NAME,
    ['source_entity_id', 'target_entity_id', 'relation_type'],
    'catalog_entity_relations_unique_active',
  );
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
