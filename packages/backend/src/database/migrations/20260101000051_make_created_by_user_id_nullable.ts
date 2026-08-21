import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Make created_by_user_id nullable in resource_relationships
  await knex.schema.alterTable('resource_relationships', (table) => {
    table.uuid('created_by_user_id').nullable().alter();
  });
}

export async function down(): Promise<void> {
  // This would require knowing the original constraint, so we skip it
  // In production, you'd want to be more careful here
}
