import type { Knex } from 'knex';

import { addTimestamps, attachUpdatedAtTrigger, detachUpdatedAtTrigger } from '../migration-helpers.js';

const TABLE_NAME = 'environments';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.string('color', 20).notNullable().defaultTo('default');
    table.boolean('is_active').notNullable().defaultTo(true);
    addTimestamps(knex, table);
  });

  await attachUpdatedAtTrigger(knex, TABLE_NAME);

  await knex(TABLE_NAME).insert([
    { slug: 'production', name: 'Producao', description: 'Ambiente de producao', color: 'danger' },
    { slug: 'staging', name: 'Homologacao', description: 'Ambiente de homologacao e testes', color: 'warning' },
    { slug: 'development', name: 'Desenvolvimento', description: 'Ambiente de desenvolvimento local', color: 'default' },
    { slug: 'sandbox', name: 'Outros', description: 'Ambiente sandbox e experimentacao', color: 'default' },
  ]);

  // Remove CHECK constraints hard-coded com os ambientes antigos
  await knex.schema.alterTable('servers', (table) => {
    table.dropChecks(['servers_environment_check']);
  });

  await knex.schema.alterTable('application_deployments', (table) => {
    table.dropChecks(['application_deployments_environment_check']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('servers', (table) => {
    table.check(
      "environment in ('production', 'staging', 'development', 'dr', 'sandbox')",
      [],
      'servers_environment_check',
    );
  });

  await knex.schema.alterTable('application_deployments', (table) => {
    table.check(
      "environment in ('production', 'staging', 'development', 'dr', 'sandbox')",
      [],
      'application_deployments_environment_check',
    );
  });

  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
