import type { Knex } from 'knex';

const TABLE_NAME = 'databases';
const INDEX_NAME = 'databases_search_vector_index';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.specificType(
      'search_vector',
      `tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('portuguese', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(display_name, '')), 'B') ||
        setweight(to_tsvector('portuguese', coalesce(engine, '')), 'C') ||
        setweight(to_tsvector('portuguese', coalesce(description, '')), 'D')
      ) STORED`,
    );
  });

  await knex.raw(`CREATE INDEX ${INDEX_NAME} ON ${TABLE_NAME} USING GIN (search_vector);`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${INDEX_NAME};`);
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('search_vector');
  });
}
