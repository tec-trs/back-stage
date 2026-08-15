import type { Knex } from 'knex';

import { addTimestamps, attachUpdatedAtTrigger, detachUpdatedAtTrigger } from '../migration-helpers.js';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('application_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    addTimestamps(knex, table);
  });

  await attachUpdatedAtTrigger(knex, 'application_types');

  await knex('application_types').insert([
    { slug: 'web_app', name: 'Aplicacao Web', description: 'Aplicacao acessada via navegador' },
    { slug: 'api_backend', name: 'API / Backend', description: 'Servico de API REST ou GraphQL' },
    { slug: 'mobile', name: 'Mobile', description: 'Aplicativo para dispositivos moveis' },
    { slug: 'batch_job', name: 'Batch / Job', description: 'Processamento em lote ou agendado' },
    { slug: 'microservice', name: 'Microsservico', description: 'Servico autonomo de dominio limitado' },
    { slug: 'monolith', name: 'Monolito', description: 'Aplicacao monolitica unica' },
    { slug: 'internal_library', name: 'Biblioteca Interna', description: 'Biblioteca de uso interno' },
    { slug: 'middleware', name: 'Middleware / Integracao', description: 'Camada de integracao entre sistemas' },
  ]);

  await knex.schema.alterTable('applications', (table) => {
    table.dropChecks(['applications_app_type_check']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, 'application_types');
  await knex.schema.dropTableIfExists('application_types');
}
