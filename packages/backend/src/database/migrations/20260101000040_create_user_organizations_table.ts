import type { Knex } from 'knex';

const TABLE_NAME = 'user_organizations';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('role', 50).notNullable().defaultTo('member');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.primary(['user_id', 'organization_id']);

    table.check("role in ('owner', 'admin', 'member')", [], 'user_organizations_role_check');
  });

  // Associate all existing users with the default organization as owners
  const defaultOrg = await knex('organizations').where({ slug: 'default' }).first();
  if (defaultOrg) {
    const users = await knex('users').select('id').whereNull('deleted_at');
    if (users.length > 0) {
      await knex(TABLE_NAME).insert(
        users.map((u: { id: string }) => ({
          user_id: u.id,
          organization_id: defaultOrg.id,
          role: 'owner',
        })),
      );
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
