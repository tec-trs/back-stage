import type { Knex } from 'knex';

const TABLE_NAME = 'users';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('password_hash', 255).notNullable().defaultTo('');
    table.specificType('roles', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"));
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('password_hash');
    table.dropColumn('roles');
  });
}
