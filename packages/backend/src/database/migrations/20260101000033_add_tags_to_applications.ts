import type { Knex } from 'knex';

const TABLE_NAME = 'applications';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.specificType('tags', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('tags');
  });
}
