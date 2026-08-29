import type { Knex } from 'knex';

import { addPartialUniqueIndex, addTimestamps, attachUpdatedAtTrigger, detachUpdatedAtTrigger } from '../migration-helpers.js';

const MAPS_TABLE = 'relationship_maps';
const MEMBERS_TABLE = 'relationship_map_members';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(MAPS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.uuid('created_by_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');

    addTimestamps(knex, table);

    table.index(['organization_id'], 'relationship_maps_org_id_index');
  });

  // Case-insensitive unique name per organization, ignoring soft-deleted maps
  // (so a retired map's name can be reused).
  await addPartialUniqueIndex(
    knex,
    MAPS_TABLE,
    ['organization_id', 'lower(name)'],
    'relationship_maps_org_name_unique_active',
  );
  await attachUpdatedAtTrigger(knex, MAPS_TABLE);

  await knex.schema.createTable(MEMBERS_TABLE, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    table.uuid('map_id').notNullable().references('id').inTable(MAPS_TABLE).onDelete('CASCADE');
    // A member points at an existing resource_relationships row — this table only
    // curates/tags real relationships into a named, documented set. It never stores
    // its own copy of source/target/relation_type, so a map can never drift from the
    // single source of truth the Ecosystem page and "Adicionar Relacionamento" write to.
    table.uuid('relationship_id').notNullable().references('id').inTable('resource_relationships').onDelete('CASCADE');
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');

    addTimestamps(knex, table);

    table.index(['map_id'], 'relationship_map_members_map_id_index');
    table.index(['relationship_id'], 'relationship_map_members_relationship_id_index');
  });

  await addPartialUniqueIndex(
    knex,
    MEMBERS_TABLE,
    ['map_id', 'relationship_id'],
    'relationship_map_members_unique_active',
  );
  await attachUpdatedAtTrigger(knex, MEMBERS_TABLE);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, MEMBERS_TABLE);
  await knex.schema.dropTableIfExists(MEMBERS_TABLE);
  await detachUpdatedAtTrigger(knex, MAPS_TABLE);
  await knex.schema.dropTableIfExists(MAPS_TABLE);
}
