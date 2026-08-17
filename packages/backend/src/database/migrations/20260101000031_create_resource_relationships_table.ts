import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'resource_relationships';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Origem
    table.string('source_type', 20).notNullable();
    table.uuid('source_id').notNullable();

    // Destino
    table.string('target_type', 20).notNullable();
    table.uuid('target_id').notNullable();

    // Tipo de relacao
    table.string('relation_type', 30).notNullable();

    // Rastreabilidade
    table.uuid('created_by_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');

    // Metadados
    table.jsonb('metadata').notNullable().defaultTo('{}');

    addTimestamps(knex, table);

    // Checks
    table.check(
      "source_type in ('server', 'application', 'database', 'url')",
      [],
      'resource_relationships_source_type_check',
    );
    table.check(
      "target_type in ('server', 'application', 'database', 'url')",
      [],
      'resource_relationships_target_type_check',
    );
    table.check(
      "relation_type in ('hosts', 'depends_on', 'connects_to', 'exposes', 'consumes', 'part_of')",
      [],
      'resource_relationships_relation_type_check',
    );
    table.check(
      "NOT (source_type = target_type AND source_id = target_id)",
      [],
      'resource_relationships_no_self_loop_check',
    );

    // Índices críticos para performance de traversal
    table.index(['source_type', 'source_id'], 'resource_relationships_source_index');
    table.index(['target_type', 'target_id'], 'resource_relationships_target_index');
    table.index(['source_type', 'source_id', 'relation_type'], 'resource_relationships_source_relation_index');
    table.index(['target_type', 'target_id', 'relation_type'], 'resource_relationships_target_relation_index');
    table.index(['relation_type'], 'resource_relationships_relation_type_index');
    table.index(['created_by_user_id'], 'resource_relationships_created_by_user_id_index');
  });

  await addPartialUniqueIndex(
    knex,
    TABLE_NAME,
    ['source_type', 'source_id', 'target_type', 'target_id', 'relation_type'],
    'resource_relationships_unique_active',
  );
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
