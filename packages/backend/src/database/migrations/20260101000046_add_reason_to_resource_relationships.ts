import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('resource_relationships', (table) => {
    table.text('reason').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('resource_relationships', (table) => {
    table.dropColumn('reason');
  });
}
