import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'urls';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Identificacao
    table.string('label', 255).notNullable();
    table.string('url', 2048).notNullable();
    table.string('url_type', 50).notNullable();
    table.text('description').nullable();

    // Vinculo com recurso dono (polimórfico)
    table.string('owner_resource_type', 20).notNullable();
    table.uuid('owner_resource_id').notNullable();
    table.check(
      "owner_resource_type in ('server', 'application', 'database')",
      [],
      'urls_owner_resource_type_check',
    );

    // HTTP / API
    table.string('method', 10).nullable();
    table.boolean('auth_required').notNullable().defaultTo(false);
    table.string('auth_method', 50).nullable();

    // Ciclo de vida / Status
    table.string('status', 50).notNullable().defaultTo('active');
    table.boolean('healthcheck_enabled').notNullable().defaultTo(false);
    table.string('last_check_status', 20).nullable();
    table.timestamp('last_checked_at', { useTz: true }).nullable();

    // Tags e Metadados
    table.specificType('tags', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"));
    table.jsonb('metadata').notNullable().defaultTo('{}');

    addTimestamps(knex, table);

    table.index(['owner_resource_type', 'owner_resource_id'], 'urls_owner_resource_index');
    table.index(['url_type'], 'urls_url_type_index');
    table.index(['status'], 'urls_status_index');
    table.check(
      "status in ('active', 'inactive', 'deprecated', 'error')",
      [],
      'urls_status_check',
    );
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['url', 'owner_resource_id'], 'urls_url_owner_unique_active');
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
