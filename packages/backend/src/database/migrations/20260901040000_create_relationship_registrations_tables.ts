import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create relationship_registrations table
  await knex.schema.createTable('relationship_registrations', (table) => {
    table.uuid('id').primary();
    table.uuid('organizationId').notNullable().index();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable();

    table.unique(['organizationId', 'name'], { indexName: 'uk_relationship_registrations_org_name' });
    table.index(['organizationId', 'deletedAt']);
  });

  // Create registered_relationships table
  await knex.schema.createTable('registered_relationships', (table) => {
    table.uuid('id').primary();
    table.uuid('registrationId').notNullable().references('id').inTable('relationship_registrations');
    table.string('sourceType').notNullable();
    table.string('sourceId').notNullable();
    table.string('sourceLabel').notNullable();
    table.string('targetType').notNullable();
    table.string('targetId').notNullable();
    table.string('targetLabel').notNullable();
    table.string('relationType').notNullable();
    table.text('reason').nullable();
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deletedAt').nullable();

    table.index(['registrationId', 'deletedAt']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('registered_relationships');
  await knex.schema.dropTableIfExists('relationship_registrations');
}
