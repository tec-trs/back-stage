import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('architecture_diagrams', (table) => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.uuid('organization_id').notNullable();
    table.jsonb('nodes').notNullable().defaultTo('[]');
    table.jsonb('edges').notNullable().defaultTo('[]');
    table.uuid('created_by').notNullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();

    table.index('organization_id');
    table.index('created_at');
    table.index(['organization_id', 'created_at']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('architecture_diagrams');
}
