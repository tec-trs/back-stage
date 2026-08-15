import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('servers', (table) => {
    table.string('domain', 255).nullable();
    table.string('fqdn', 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('servers', (table) => {
    table.dropColumn('domain');
    table.dropColumn('fqdn');
  });
}
