import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'compliance_checks';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.string('framework', 100).notNullable();
    table.text('description').nullable();
    table.string('severity', 50).notNullable().defaultTo('medium');
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['framework'], 'compliance_checks_framework_index');
    table.index(['severity'], 'compliance_checks_severity_index');
    table.check(
      "severity in ('low', 'medium', 'high', 'critical')",
      [],
      'compliance_checks_severity_check',
    );
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['slug'], 'compliance_checks_slug_unique_active');
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
