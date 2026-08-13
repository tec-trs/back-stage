import type { Knex } from 'knex';

import {
  addPartialUniqueIndex,
  addTimestamps,
  attachUpdatedAtTrigger,
  detachUpdatedAtTrigger,
} from '../migration-helpers.js';

const TABLE_NAME = 'applications';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Identificacao
    table.string('code', 100).notNullable();
    table.string('display_name', 255).notNullable();
    table.text('description').nullable();
    table.string('app_type', 50).notNullable();
    table.string('business_category', 255).nullable();
    table.string('criticality', 20).notNullable().defaultTo('medium');

    // Ciclo de vida
    table.string('status', 50).notNullable().defaultTo('active');

    // Tecnologia / Stack
    table.string('language', 100).nullable();
    table.string('framework', 100).nullable();
    table.string('current_version', 50).nullable();
    table.string('repository_url', 2048).nullable();
    table.string('cicd_url', 2048).nullable();
    table.string('container_image', 512).nullable();

    // Seguranca
    table.string('data_classification', 50).nullable();
    table.string('auth_method', 50).nullable();

    // Responsabilidade / Governanca
    table.string('owner_team', 255).nullable();
    table.uuid('owner_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('cost_center', 100).nullable();
    table.decimal('monthly_cost_estimate', 12, 2).nullable();

    // Documentacao / Monitoramento
    table.string('docs_url', 2048).nullable();
    table.string('api_spec_url', 2048).nullable();
    table.string('runbook_url', 2048).nullable();
    table.string('monitoring_url', 2048).nullable();
    table.string('sla', 100).nullable();
    table.string('health_check_url', 2048).nullable();

    table.jsonb('metadata').notNullable().defaultTo('{}');
    addTimestamps(knex, table);

    table.index(['status'], 'applications_status_index');
    table.index(['criticality'], 'applications_criticality_index');
    table.index(['owner_user_id'], 'applications_owner_user_id_index');
    table.check(
      "app_type in ('web_app', 'api_backend', 'mobile', 'batch_job', 'microservice', 'monolith', 'internal_library', 'middleware')",
      [],
      'applications_app_type_check',
    );
    table.check(
      "criticality in ('critical', 'high', 'medium', 'low')",
      [],
      'applications_criticality_check',
    );
    table.check(
      "status in ('developing', 'active', 'maintenance', 'deprecated', 'deactivated')",
      [],
      'applications_status_check',
    );
  });

  await addPartialUniqueIndex(knex, TABLE_NAME, ['code'], 'applications_code_unique_active');
  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
