import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'servers';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Identificacao
    table.string('hostname', 255).notNullable();
    table.string('display_name', 255).nullable();
    table.text('description').nullable();
    table.string('server_type', 50).notNullable();
    table.string('provider', 50).notNullable();

    // Hardware / Recursos
    table.integer('cpu_cores').nullable();
    table.string('cpu_model', 255).nullable();
    table.integer('ram_gb').nullable();
    table.string('hypervisor', 100).nullable();

    // Sistema Operacional
    table.string('os_name', 100).nullable();
    table.string('os_version', 100).nullable();
    table.string('os_architecture', 20).nullable();
    table.date('os_eol_date').nullable();

    // Redes
    table.specificType('private_ips', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"));
    table.string('public_ip', 100).nullable();
    table.string('vlan_subnet', 100).nullable();
    table.string('gateway', 100).nullable();
    table.specificType('dns_servers', 'text[]').notNullable().defaultTo(knex.raw("'{}'::text[]"));

    // Acesso / Seguranca
    table.string('access_method', 50).nullable();
    table.string('security_group', 255).nullable();
    table.string('data_classification', 50).nullable();

    // Ciclo de vida
    table.string('status', 50).notNullable().defaultTo('active');
    table.string('environment', 50).notNullable();

    // Responsabilidade / Governanca
    table.string('owner_team', 255).nullable();
    table.uuid('owner_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('cost_center', 100).nullable();

    // Backup & DR
    table.boolean('has_backup').notNullable().defaultTo(false);
    table.string('backup_policy', 255).nullable();
    table.timestamp('last_backup_at', { useTz: true }).nullable();

    // Custos
    table.decimal('monthly_cost_estimate', 12, 2).nullable();

    // Monitoramento
    table.string('monitoring_url', 2048).nullable();

    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['environment'], 'servers_environment_index');
    table.index(['status'], 'servers_status_index');
    table.index(['owner_user_id'], 'servers_owner_user_id_index');
    table.check(
      "server_type in ('vm', 'bare_metal', 'container_host', 'kubernetes_node', 'serverless', 'managed_cloud')",
      [],
      'servers_server_type_check',
    );
    table.check(
      "provider in ('on_premise', 'aws', 'azure', 'gcp', 'oracle_cloud', 'own_datacenter')",
      [],
      'servers_provider_check',
    );
    table.check(
      "status in ('active', 'maintenance', 'provisioning', 'deactivated')",
      [],
      'servers_status_check',
    );
    table.check(
      "environment in ('production', 'staging', 'development', 'dr', 'sandbox')",
      [],
      'servers_environment_check',
    );
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['hostname'], 'servers_hostname_unique_active');
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
