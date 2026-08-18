import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'organizations';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 100).notNullable();
    table.string('name', 255).notNullable();
    table.string('plan', 50).notNullable().defaultTo('free');
    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['slug'], 'organizations_slug_unique_active');
  await attachUpdatedAtTrigger(knex, TABLE_NAME);

  // Seed a default organization so existing data keeps working
  await knex(TABLE_NAME).insert({
    slug: 'default',
    name: 'Organização Padrão',
    plan: 'enterprise',
  });
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
