import type { Knex } from 'knex';

import {
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'deployments';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('entity_id')
      .notNullable()
      .references('id')
      .inTable('catalog_entities')
      .onDelete('CASCADE');
    table.string('environment', 50).notNullable();
    table.string('version', 100).notNullable();
    table.string('status', 50).notNullable().defaultTo('pending');
    table
      .uuid('triggered_by_user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.timestamp('started_at', { useTz: true }).nullable();
    table.timestamp('finished_at', { useTz: true }).nullable();
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['entity_id'], 'deployments_entity_id_index');
    table.index(['status'], 'deployments_status_index');
    table.index(['environment'], 'deployments_environment_index');
    table.check(
      "environment in ('development', 'staging', 'production')",
      [],
      'deployments_environment_check',
    );
    table.check(
      "status in ('pending', 'running', 'succeeded', 'failed', 'rolled_back')",
      [],
      'deployments_status_check',
    );
  });

  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
