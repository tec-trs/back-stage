import type { Knex } from 'knex';

const TABLE_NAME = 'server_group_members';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Relacionamento
    table.uuid('group_id').notNullable().references('id').inTable('server_groups').onDelete('CASCADE');
    table.uuid('server_id').notNullable().references('id').inTable('servers').onDelete('CASCADE');

    // Ordem (para preservar ordem dos servidores no grupo)
    table.integer('order').notNullable().defaultTo(0);

    // Organização
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Soft delete
    table.timestamp('deleted_at').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Índices
    table.index(['group_id'], 'server_group_members_group_id_index');
    table.index(['server_id'], 'server_group_members_server_id_index');
    table.index(['organization_id'], 'server_group_members_org_id_index');
    table.unique(['group_id', 'server_id'], 'server_group_members_unique');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
