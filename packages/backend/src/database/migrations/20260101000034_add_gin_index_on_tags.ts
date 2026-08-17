import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Criar índices GIN em colunas tags para suportar buscas e filtros eficientes
  // Operadores suportados: tags @> ARRAY['tag'] (contém), tags && ARRAY['tag'] (intersecta)
  await knex.raw('CREATE INDEX servers_tags_gin_index ON servers USING GIN (tags)');
  await knex.raw('CREATE INDEX applications_tags_gin_index ON applications USING GIN (tags)');
  await knex.raw('CREATE INDEX databases_tags_gin_index ON databases USING GIN (tags)');
  await knex.raw('CREATE INDEX urls_tags_gin_index ON urls USING GIN (tags)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS servers_tags_gin_index');
  await knex.raw('DROP INDEX IF EXISTS applications_tags_gin_index');
  await knex.raw('DROP INDEX IF EXISTS databases_tags_gin_index');
  await knex.raw('DROP INDEX IF EXISTS urls_tags_gin_index');
}
