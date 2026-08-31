import type { Knex } from 'knex';

import { addPartialUniqueIndex, addTimestamps, attachUpdatedAtTrigger, detachUpdatedAtTrigger } from '../migration-helpers.js';

// Documentation-first grouping for databases that make more sense discussed as
// a set than one by one — e.g. a multi-empresa OpenEdge/TOTVS install where a
// servidor hosts a dozen+ bancos (ADT/CAD/ESP/MOV per empresa, plus shared
// EMS5/EMSFND/etc) and the same banco can legitimately belong to more than one
// named grupo (a shared banco used by several empresas). This is deliberately
// NOT wired into resource_relationships or Impact Analysis: the real,
// granular servidor->banco and banco->aplicacao relationships already do that
// job and keep working exactly as they do today. A database_group is a
// curated catalog entry (name + description + member bancos + the
// aplicacoes documented as using it) — same shape as relationship_maps, one
// level up: relationship_maps curates a set of relacionamentos, this curates
// a set of bancos.
const GROUPS_TABLE = 'database_groups';
const MEMBERS_TABLE = 'database_group_members';
const APPLICATIONS_TABLE = 'database_group_applications';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(GROUPS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.uuid('created_by_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');

    addTimestamps(knex, table);

    table.index(['organization_id'], 'database_groups_org_id_index');
  });

  // Case-insensitive unique name per organization, ignoring soft-deleted
  // grupos (so a retired grupo's name can be reused) — same pattern as
  // relationship_maps_org_name_unique_active.
  await addPartialUniqueIndex(knex, GROUPS_TABLE, ['organization_id', 'lower(name)'], 'database_groups_org_name_unique_active');
  await attachUpdatedAtTrigger(knex, GROUPS_TABLE);

  await knex.schema.createTable(MEMBERS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('group_id').notNullable().references('id').inTable(GROUPS_TABLE).onDelete('CASCADE');
    table.uuid('database_id').notNullable().references('id').inTable('databases').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    addTimestamps(knex, table);

    table.index(['group_id'], 'database_group_members_group_id_index');
    table.index(['database_id'], 'database_group_members_database_id_index');
  });

  // Many-to-many by design: a banco compartilhado (EMS5, EMSFND, ...) can be a
  // member of more than one grupo at once.
  await addPartialUniqueIndex(knex, MEMBERS_TABLE, ['group_id', 'database_id'], 'database_group_members_unique_active');
  await attachUpdatedAtTrigger(knex, MEMBERS_TABLE);

  await knex.schema.createTable(APPLICATIONS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('group_id').notNullable().references('id').inTable(GROUPS_TABLE).onDelete('CASCADE');
    table.uuid('application_id').notNullable().references('id').inTable('applications').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    addTimestamps(knex, table);

    table.index(['group_id'], 'database_group_applications_group_id_index');
    table.index(['application_id'], 'database_group_applications_application_id_index');
  });

  // Many-to-many here too: one aplicacao can use more than one grupo (rare
  // but possible), and one grupo can be documented against more than one
  // aplicacao.
  await addPartialUniqueIndex(
    knex,
    APPLICATIONS_TABLE,
    ['group_id', 'application_id'],
    'database_group_applications_unique_active',
  );
  await attachUpdatedAtTrigger(knex, APPLICATIONS_TABLE);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, APPLICATIONS_TABLE);
  await knex.schema.dropTableIfExists(APPLICATIONS_TABLE);
  await detachUpdatedAtTrigger(knex, MEMBERS_TABLE);
  await knex.schema.dropTableIfExists(MEMBERS_TABLE);
  await detachUpdatedAtTrigger(knex, GROUPS_TABLE);
  await knex.schema.dropTableIfExists(GROUPS_TABLE);
}
