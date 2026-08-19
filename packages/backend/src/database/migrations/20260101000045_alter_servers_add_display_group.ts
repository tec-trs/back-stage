import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('servers', (table) => {
    table.string('display_group', 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('servers', (table) => {
    table.dropColumn('display_group');
  });
}
