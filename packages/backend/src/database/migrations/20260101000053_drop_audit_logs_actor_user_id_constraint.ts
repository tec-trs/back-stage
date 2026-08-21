import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Drop the foreign key constraint on actor_user_id
  try {
    await knex.raw('ALTER TABLE audit_logs DROP CONSTRAINT audit_logs_actor_user_id_foreign');
  } catch (error) {
    console.log('Constraint already removed or does not exist');
  }
}

export async function down(knex: Knex): Promise<void> {
  // No rollback for this - in production you'd want to be more careful
}
