import type { Knex } from 'knex';

import { addTimestamps, attachUpdatedAtTrigger, detachUpdatedAtTrigger } from '../migration-helpers.js';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('server_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    addTimestamps(knex, table);
  });

  await attachUpdatedAtTrigger(knex, 'server_types');

  await knex('server_types').insert([
    { slug: 'vm', name: 'Maquina Virtual', description: 'Servidor virtualizado em hypervisor' },
    { slug: 'bare_metal', name: 'Servidor Fisico', description: 'Hardware dedicado sem virtualizacao' },
    { slug: 'container_host', name: 'Container / Kubernetes', description: 'Host de containers Docker ou no Kubernetes' },
  ]);

  await knex.schema.alterTable('servers', (table) => {
    table.dropChecks(['servers_server_type_check']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, 'server_types');
  await knex.schema.dropTableIfExists('server_types');
}
