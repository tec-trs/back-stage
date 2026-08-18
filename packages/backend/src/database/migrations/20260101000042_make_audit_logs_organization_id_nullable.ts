import type { Knex } from 'knex';

// audit_logs.organization_id was made NOT NULL in migration 041 (together with resource tables),
// but the audit logger runs from routes that have no organization context (user management,
// auth, etc.). Making the column nullable allows cross-org audit events to be recorded.
export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE audit_logs ALTER COLUMN organization_id DROP NOT NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE audit_logs ALTER COLUMN organization_id SET NOT NULL');
}
