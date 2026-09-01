import type { Knex } from 'knex';

import { addTimestamps, attachUpdatedAtTrigger, detachUpdatedAtTrigger } from '../migration-helpers.js';

const TABLE_NAME = 'database_ports';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('organization_id').notNullable().references('id').inTable('organizations').onDelete('CASCADE');
    table.uuid('database_id').notNullable().references('id').inTable('databases').onDelete('CASCADE');
    
    table.integer('port').notNullable();
    table.text('parameters').nullable();
    
    addTimestamps(knex, table);
    
    // Unique index: mesma porta nao pode aparecer 2x no mesmo banco
    table.unique(['database_id', 'port'], { indexName: 'database_ports_db_port_unique' });
  });

  await attachUpdatedAtTrigger(knex, TABLE_NAME);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, TABLE_NAME);
  await knex.schema.dropTableIfExists(TABLE_NAME);
}
