import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Drop the foreign key constraint on created_by_user_id
  try {
    await knex.raw('ALTER TABLE resource_relationships DROP CONSTRAINT resource_relationships_created_by_user_id_foreign');
  } catch (error) {
    console.log('Constraint already removed or does not exist');
  }

  // Make sure the column is nullable
  await knex.schema.alterTable('resource_relationships', (table) => {
    table.uuid('created_by_user_id').nullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // No rollback for this - in production you'd want to be more careful
}
