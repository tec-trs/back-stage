import type { Knex } from 'knex';

import { attachUpdatedAtTrigger, detachUpdatedAtTrigger } from '../migration-helpers.js';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('database_engines', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 50).notNullable().unique();
    table.string('name', 100).notNullable();
    table.text('description').nullable();
    table.integer('default_port').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  await attachUpdatedAtTrigger(knex, 'database_engines');

  await knex('database_engines').insert([
    { slug: 'postgres', name: 'PostgreSQL', description: 'PostgreSQL relational database', default_port: 5432 },
    { slug: 'mysql', name: 'MySQL', description: 'MySQL relational database', default_port: 3306 },
    { slug: 'mariadb', name: 'MariaDB', description: 'MariaDB relational database', default_port: 3306 },
    { slug: 'mongodb', name: 'MongoDB', description: 'MongoDB document database', default_port: 27017 },
    { slug: 'redis', name: 'Redis', description: 'Redis in-memory data store', default_port: 6379 },
    { slug: 'oracle', name: 'Oracle Database', description: 'Oracle relational database', default_port: 1521 },
    { slug: 'sqlserver', name: 'SQL Server', description: 'Microsoft SQL Server', default_port: 1433 },
    { slug: 'elasticsearch', name: 'Elasticsearch', description: 'Elasticsearch search and analytics engine', default_port: 9200 },
    { slug: 'cassandra', name: 'Apache Cassandra', description: 'Cassandra distributed database', default_port: 9042 },
    { slug: 'dynamodb', name: 'Amazon DynamoDB', description: 'AWS DynamoDB managed NoSQL', default_port: null },
    { slug: 'other', name: 'Outro', description: 'Outro tipo de banco de dados', default_port: null },
  ]);
}

export async function down(knex: Knex): Promise<void> {
  await detachUpdatedAtTrigger(knex, 'database_engines');
  await knex.schema.dropTableIfExists('database_engines');
}
