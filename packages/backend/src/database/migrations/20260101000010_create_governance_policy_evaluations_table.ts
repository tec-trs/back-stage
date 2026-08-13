import type { Knex } from 'knex';

import {
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'governance_policy_evaluations';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('policy_id')
      .notNullable()
      .references('id')
      .inTable('governance_policies')
      .onDelete('CASCADE');
    table
      .uuid('entity_id')
      .notNullable()
      .references('id')
      .inTable('catalog_entities')
      .onDelete('CASCADE');
    table.string('status', 50).notNullable();
    table.text('details').nullable();
    table.timestamp('evaluated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['policy_id'], 'governance_policy_evaluations_policy_id_index');
    table.index(['entity_id'], 'governance_policy_evaluations_entity_id_index');
    table.index(['status'], 'governance_policy_evaluations_status_index');
    table.check(
      "status in ('pass', 'fail', 'warning')",
      [],
      'governance_policy_evaluations_status_check',
    );
  });

  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
