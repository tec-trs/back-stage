import type { Knex } from 'knex';

const TABLE_NAME = 'databases';
const OLD_INDEX = 'databases_name_unique_active';
const NEW_INDEX = 'databases_org_server_name_port_unique_active';

// databases_name_unique_active predates organization_id on this table and
// was never rebuilt when 20260101000041_add_organization_id_to_resource_tables
// rescoped the equivalent indexes on servers/applications — so today `name`
// alone must be unique across ALL organizations, for every banco in the
// system. That's wrong on two counts: it isn't scoped per organization like
// every sibling resource table, and — the concrete case that surfaced it —
// the same banco name legitimately repeats on the same servidor when only
// the port (or connection string) differs, e.g. more than one EMS2ADT
// instance on one server distinguished by port. Rescope to
// (organization_id, hosted_on_server_id, name, port).
//
// Postgres unique indexes treat NULL as distinct from any other NULL, so a
// banco with no hosted_on_server_id and/or no port set is not compared
// against other such bancos at all. That's intentional here: the
// constraint exists to catch a *documented* collision (same org, same
// server, same name, same port), not to force every banco to have a
// server+port before it can be saved.
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${OLD_INDEX}`);
  await knex.raw(`
    CREATE UNIQUE INDEX ${NEW_INDEX}
    ON ${TABLE_NAME} (organization_id, hosted_on_server_id, name, port)
    WHERE deleted_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS ${NEW_INDEX}`);
  // Lossy if duplicate (org, server, name, port) combinations were created
  // while the new index was active — same caveat as any unique-index
  // narrowing migration's down path.
  await knex.raw(`
    CREATE UNIQUE INDEX ${OLD_INDEX}
    ON ${TABLE_NAME} (name)
    WHERE deleted_at IS NULL
  `);
}
