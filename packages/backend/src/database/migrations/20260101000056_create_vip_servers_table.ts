import type { Knex } from 'knex';

const TABLE_NAME = 'vip_servers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Relacionamento
    table.uuid('vip_id').notNullable().references('id').inTable('vips').onDelete('CASCADE');
    table.uuid('server_id').notNullable().references('id').inTable('servers').onDelete('CASCADE');

    // Ordem (para preservar ordem dos servidores)
    table.integer('order').notNullable().defaultTo(0);

    // Organização
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Soft delete
    table.timestamp('deleted_at').nullable();

    // Timestamps
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Índices
    table.index(['vip_id'], 'vip_servers_vip_id_index');
    table.index(['server_id'], 'vip_servers_server_id_index');
    table.index(['organization_id'], 'vip_servers_org_id_index');
    table.unique(['vip_id', 'server_id'], 'vip_servers_unique');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
