import type { Knex } from 'knex';

const TABLE_NAME = 'databases';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // Codigo unico para usar em relacoes com outros cadastros
    // Comeca como nullable, depois populamos com UUIDs
    table.string('code', 50).nullable().unique();
    
    // Nomes conforme especificacao
    table.string('physical_name', 255).nullable();
    table.string('logical_name', 255).nullable();
    table.string('path', 1024).nullable();
  });

  // Popula 'code' com um valor padrao para linhas existentes
  // Se o banco ja tem um code, nao muda; senao gera um novo
  await knex.raw(`
    UPDATE ${TABLE_NAME}
    SET code = 'DB-' || SUBSTRING(id::text, 1, 8) || '-' || FLOOR(RANDOM() * 10000)::text
    WHERE code IS NULL
  `);

  // Agora torna NOT NULL
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('code', 50).notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('code');
    table.dropColumn('physical_name');
    table.dropColumn('logical_name');
    table.dropColumn('path');
  });
}
