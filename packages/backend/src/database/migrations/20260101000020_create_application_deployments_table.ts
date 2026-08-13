import type { Knex } from 'knex';

import { addPartialUniqueIndex } from '../migration-helpers.js';

const TABLE_NAME = 'application_deployments';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('application_id')
      .notNullable()
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE');
    table.uuid('server_id').notNullable().references('id').inTable('servers').onDelete('CASCADE');
    table.string('environment', 50).notNullable();
    table.string('deploy_method', 50).nullable();
    table.string('access_url', 2048).nullable();
    table.specificType('ports', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"));
    table.string('deployed_version', 50).nullable();
    table.timestamp('last_deployed_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    table.index(['application_id'], 'application_deployments_application_id_index');
    table.index(['server_id'], 'application_deployments_server_id_index');
    table.check(
      "environment in ('production', 'staging', 'development', 'dr', 'sandbox')",
      [],
      'application_deployments_environment_check',
    );
  });

  await addPartialUniqueIndex(
    knex,
    TABLE_NAME,
    ['application_id', 'server_id', 'environment'],
    'application_deployments_unique_active',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
