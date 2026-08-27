import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('node_positions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('node_id').notNullable();
    table.float('x').notNullable();
    table.float('y').notNullable();
    table.timestamps(true, true);

    table.unique(['node_id']);
    table.index(['created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('node_positions');
}
