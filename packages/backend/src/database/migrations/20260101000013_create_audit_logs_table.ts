import type { Knex } from 'knex';

const TABLE_NAME = 'audit_logs';

// audit_logs e um log de eventos imutavel: sem updated_at/trigger e sem soft delete por design.
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('actor_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.string('action', 255).notNullable();
    table.string('resource_type', 100).notNullable();
    table.uuid('resource_id').nullable();
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 512).nullable();
    table.jsonb('metadata').notNullable().defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['actor_user_id'], 'audit_logs_actor_user_id_index');
    table.index(['resource_type', 'resource_id'], 'audit_logs_resource_index');
    table.index(['action'], 'audit_logs_action_index');
    table.index(['created_at'], 'audit_logs_created_at_index');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
