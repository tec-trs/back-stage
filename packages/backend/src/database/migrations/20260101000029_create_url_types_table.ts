import type { Knex } from 'knex';

import { attachUpdatedAtTrigger, detachUpdatedAtTrigger } from '../migration-helpers.js';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('url_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await attachUpdatedAtTrigger(knex, 'url_types');

  await knex('url_types').insert([
    { slug: 'public', name: 'Publica', description: 'URL pública ou externa' },
    { slug: 'internal', name: 'Interna', description: 'URL para uso interno apenas' },
    { slug: 'api', name: 'API', description: 'Endpoint de API' },
    { slug: 'webhook', name: 'Webhook', description: 'URL de webhook' },
    { slug: 'admin_panel', name: 'Painel Admin', description: 'Painel de administração' },
    { slug: 'documentation', name: 'Documentação', description: 'URL de documentação' },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, 'url_types');
  await knex.schema.dropTableIfExists('url_types');
}
