import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'users';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable();
    table.string('full_name', 255).notNullable();
    table.string('avatar_url', 2048).nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['is_active'], 'users_is_active_index');
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['email'], 'users_email_unique_active');
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
