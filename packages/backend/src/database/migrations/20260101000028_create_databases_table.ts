import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'databases';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Identificacao
    table.string('name', 255).notNullable();
    table.string('display_name', 255).nullable();
    table.text('description').nullable();
    table.string('engine', 50).notNullable();

    // Versao / Infraestrutura
    table.string('version', 50).nullable();
    table.integer('port').nullable();
    table.uuid('hosted_on_server_id').nullable().references('id').inTable('servers').onDelete('SET NULL');
    table.string('connection_host', 255).nullable();
    table.string('connection_string_template', 2048).nullable();
    table.boolean('is_managed_service').notNullable().defaultTo(false);

    // Seguranca / Governanca
    table.string('data_classification', 50).nullable();
    table.string('criticality', 20).notNullable().defaultTo('medium');

    // Responsabilidade
    table.string('owner_team', 255).nullable();
    table.uuid('owner_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('cost_center', 100).nullable();

    // Capacidade
    table.integer('storage_gb').nullable();
    table.string('replication_mode', 50).nullable();

    // Backup / DR
    table.boolean('has_backup').notNullable().defaultTo(false);
    table.string('backup_policy', 255).nullable();
    table.timestamp('last_backup_at', { useTz: true }).nullable();

    // Ciclo de vida
    table.string('status', 50).notNullable().defaultTo('active');
    table.string('environment', 50).notNullable();

    // Monitoramento
    table.string('monitoring_url', 2048).nullable();

    // Tags e Metadados
    table.specificType('tags', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"));
    table.jsonb('metadata').notNullable().defaultTo('{}');

    addTimestamps(knex, table);

    table.index(['environment'], 'databases_environment_index');
    table.index(['status'], 'databases_status_index');
    table.index(['engine'], 'databases_engine_index');
    table.index(['criticality'], 'databases_criticality_index');
    table.index(['owner_user_id'], 'databases_owner_user_id_index');
    table.index(['hosted_on_server_id'], 'databases_hosted_on_server_id_index');
    table.check(
      "criticality in ('critical', 'high', 'medium', 'low')",
      [],
      'databases_criticality_check',
    );
    table.check(
      "status in ('active', 'maintenance', 'provisioning', 'deactivated', 'deprecated')",
      [],
      'databases_status_check',
    );
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['name'], 'databases_name_unique_active');
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
