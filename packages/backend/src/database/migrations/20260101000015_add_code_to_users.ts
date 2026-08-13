import type { Knex } from 'knex';

import { addPartialUniqueIndex } from '../migration-helpers.js';

const TABLE_NAME = 'users';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('code', 50).nullable();
  });

  await knex.raw(`
    UPDATE ${TABLE_NAME}
    SET code = lower(split_part(email, '@', 1))
    WHERE code IS NULL
  `);

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('code', 50).notNullable().alter();
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['code'], 'users_code_unique_active');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS users_code_unique_active;`);
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('code');
  });
}
