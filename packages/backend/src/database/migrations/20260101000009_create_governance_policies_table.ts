import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'governance_policies';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('slug', 255).notNullable();
    table.text('description').nullable();
    table.string('policy_type', 50).notNullable();
    table.text('definition').notNullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['policy_type'], 'governance_policies_policy_type_index');
    table.check(
      "policy_type in ('security', 'cost', 'compliance', 'quality')",
      [],
      'governance_policies_policy_type_check',
    );
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['slug'], 'governance_policies_slug_unique_active');
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
