import type { Knex } from 'knex';

import {
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'server_groups';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Organização
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Metadados
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.string('environment', 50).nullable();
    table.string('status', 20).notNullable().defaultTo('active');
    table.string('criticality', 20).nullable();

    // Soft delete
    table.timestamp('deleted_at').nullable();

    addTimestamps(knex, table);

    // Índices
    table.index(['organization_id'], 'server_groups_org_id_index');
    table.index(['name'], 'server_groups_name_index');
    table.index(['deleted_at'], 'server_groups_deleted_at_index');
  });

  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
