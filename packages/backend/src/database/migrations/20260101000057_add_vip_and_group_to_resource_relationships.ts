import type { Knex } from 'knex';

const TABLE_NAME = 'resource_relationships';

export async function up(knex: Knex): Promise<void> {
  // Remove as constraints antigas
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropChecks(['resource_relationships_source_type_check', 'resource_relationships_target_type_check']);
  });

  // Adiciona as novas constraints com vip e group
  await knex.raw(`
    ALTER TABLE ${TABLE_NAME}
    ADD CONSTRAINT resource_relationships_source_type_check
    CHECK (source_type in ('server', 'application', 'database', 'url', 'vip', 'group'))
  `);

  await knex.raw(`
    ALTER TABLE ${TABLE_NAME}
    ADD CONSTRAINT resource_relationships_target_type_check
    CHECK (target_type in ('server', 'application', 'database', 'url', 'vip', 'group'))
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Remove as constraints novas
  await knex.raw(`
    ALTER TABLE ${TABLE_NAME}
    DROP CONSTRAINT resource_relationships_source_type_check
  `);

  await knex.raw(`
    ALTER TABLE ${TABLE_NAME}
    DROP CONSTRAINT resource_relationships_target_type_check
  `);

  // Restaura as constraints antigas
  await knex.raw(`
    ALTER TABLE ${TABLE_NAME}
    ADD CONSTRAINT resource_relationships_source_type_check
    CHECK (source_type in ('server', 'application', 'database', 'url'))
  `);

  await knex.raw(`
    ALTER TABLE ${TABLE_NAME}
    ADD CONSTRAINT resource_relationships_target_type_check
    CHECK (target_type in ('server', 'application', 'database', 'url'))
  `);
}
