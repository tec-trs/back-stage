import type { Knex } from 'knex';

import {
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'governance_policy_exemptions';

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
    table.text('reason').notNullable();
    table
      .uuid('requested_by_user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table
      .uuid('approved_by_user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('status', 50).notNullable().defaultTo('pending');
    table.timestamp('expires_at', { useTz: true }).nullable();
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['policy_id'], 'governance_policy_exemptions_policy_id_index');
    table.index(['entity_id'], 'governance_policy_exemptions_entity_id_index');
    table.index(['status'], 'governance_policy_exemptions_status_index');
    table.check(
      "status in ('pending', 'approved', 'rejected')",
      [],
      'governance_policy_exemptions_status_check',
    );
  });

  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
