import type { Knex } from 'knex';

const TABLE_NAME = 'servers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('access_user', 255).nullable();
    table.text('observations').nullable();
    table.specificType('tags', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"));
    table.jsonb('services').notNullable().defaultTo('[]');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('access_user');
    table.dropColumn('observations');
    table.dropColumn('tags');
    table.dropColumn('services');
  });
}
