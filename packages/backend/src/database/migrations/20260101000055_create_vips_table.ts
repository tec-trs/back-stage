import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'vips';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Organização
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    // Identificação
    table.string('hostname', 255).notNullable();
    table.string('display_name', 255).nullable();
    table.text('description').nullable();

    // VIP Configuration
    table.string('vip_address', 45).nullable();
    table.string('load_balancer_type', 50).nullable();
    table.integer('health_check_interval').nullable().defaultTo(30);
    table.string('health_check_path', 255).nullable();

    // Metadados
    table.string('status', 20).notNullable().defaultTo('active');
    table.string('environment', 50).nullable();
    table.string('criticality', 20).nullable();

    // Governance
    table.string('owner_team', 255).nullable();
    table.uuid('owner_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('cost_center', 100).nullable();

    addTimestamps(knex, table);

    // Índices
    table.index(['organization_id'], 'vips_org_id_index');
    table.index(['hostname'], 'vips_hostname_index');
    table.index(['status'], 'vips_status_index');
  });

  await addPartialUniqueIndex(
    knex,
    TABLE_NAME,
    ['hostname', 'organization_id'],
    'vips_hostname_org_unique_active',
  );

  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.raw(`DROP INDEX IF EXISTS vips_hostname_org_unique_active`);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
