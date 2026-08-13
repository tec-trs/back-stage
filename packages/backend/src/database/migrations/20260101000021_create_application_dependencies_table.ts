import type { Knex } from 'knex';

import { addPartialUniqueIndex } from '../migration-helpers.js';

const TABLE_NAME = 'application_dependencies';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table
      .uuid('application_id')
      .notNullable()
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE');
    table
      .uuid('depends_on_application_id')
      .notNullable()
      .references('id')
      .inTable('applications')
      .onDelete('CASCADE');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    table.index(['application_id'], 'application_dependencies_application_id_index');
    table.index(
      ['depends_on_application_id'],
      'application_dependencies_depends_on_application_id_index',
    );
    table.check(
      'application_id <> depends_on_application_id',
      [],
      'application_dependencies_no_self_reference_check',
    );
  });

  await addPartialUniqueIndex(
    knex,
    TABLE_NAME,
    ['application_id', 'depends_on_application_id'],
    'application_dependencies_unique_active',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
