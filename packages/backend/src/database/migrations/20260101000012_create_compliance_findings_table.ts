import type { Knex } from 'knex';

import {
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'compliance_findings';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('check_id')
      .notNullable()
      .references('id')
      .inTable('compliance_checks')
      .onDelete('CASCADE');
    table
      .uuid('entity_id')
      .notNullable()
      .references('id')
      .inTable('catalog_entities')
      .onDelete('CASCADE');
    table.string('status', 50).notNullable().defaultTo('open');
    table.timestamp('detected_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('resolved_at', { useTz: true }).nullable();
    table
      .uuid('resolved_by_user_id')
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['check_id'], 'compliance_findings_check_id_index');
    table.index(['entity_id'], 'compliance_findings_entity_id_index');
    table.index(['status'], 'compliance_findings_status_index');
    table.check(
      "status in ('open', 'resolved', 'accepted_risk', 'false_positive')",
      [],
      'compliance_findings_status_check',
    );
  });

  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
