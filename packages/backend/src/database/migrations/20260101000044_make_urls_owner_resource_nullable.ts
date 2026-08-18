import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE urls ALTER COLUMN owner_resource_type DROP NOT NULL`);
  await knex.raw(`ALTER TABLE urls ALTER COLUMN owner_resource_id DROP NOT NULL`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`UPDATE urls SET owner_resource_type = 'application' WHERE owner_resource_type IS NULL`);
  await knex.raw(`UPDATE urls SET owner_resource_id = '00000000-0000-0000-0000-000000000000' WHERE owner_resource_id IS NULL`);
  await knex.raw(`ALTER TABLE urls ALTER COLUMN owner_resource_type SET NOT NULL`);
  await knex.raw(`ALTER TABLE urls ALTER COLUMN owner_resource_id SET NOT NULL`);
}
