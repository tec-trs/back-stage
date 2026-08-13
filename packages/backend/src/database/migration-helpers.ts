import type { Knex } from 'knex';

export function addTimestamps(
  knex: Knex,
  table: Knex.CreateTableBuilder,
  options: { softDelete?: boolean } = {},
): void {
  table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

  if (options.softDelete !== false) {
    table.timestamp('deleted_at', { useTz: true }).nullable();
  }
}

export async function attachUpdatedAtTrigger(knex: Knex, tableName: string): Promise<void> {
  await knex.raw(`
    CREATE TRIGGER set_${tableName}_updated_at
    BEFORE UPDATE ON ${tableName}
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  `);
}

export async function detachUpdatedAtTrigger(knex: Knex, tableName: string): Promise<void> {
  await knex.raw(`DROP TRIGGER IF EXISTS set_${tableName}_updated_at ON ${tableName};`);
}

export async function addPartialUniqueIndex(
  knex: Knex,
  tableName: string,
  columns: string[],
  indexName: string,
): Promise<void> {
  const columnList = columns.join(', ');
  await knex.raw(
    `CREATE UNIQUE INDEX ${indexName} ON ${tableName} (${columnList}) WHERE deleted_at IS NULL;`,
  );
}
