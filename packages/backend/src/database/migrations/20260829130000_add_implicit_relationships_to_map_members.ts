import type { Knex } from 'knex';

const MEMBERS_TABLE = 'relationship_map_members';

/**
 * A relationship map member originally could only point at a real row in
 * resource_relationships. But two relationship types are modeled elsewhere in
 * the CMDB instead of getting their own row there: "hosts" between a servidor
 * and an aplicacao (application_deployments) and "expoe" targeting a url
 * (urls.owner_resource_id). This migration lets a member also be a natural-key
 * snapshot (source/target/relation type) of one of those implicit relationships,
 * so they can be tagged into a map like any other relationship.
 *
 * A member row is now either an explicit pointer (relationship_id set, natural-key
 * columns null) or an implicit snapshot (relationship_id null, all natural-key
 * columns set) — never both, never neither, enforced by a check constraint.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(MEMBERS_TABLE, (table) => {
    table.uuid('relationship_id').nullable().alter();
    table.string('source_type', 20).nullable();
    table.uuid('source_id').nullable();
    table.string('target_type', 20).nullable();
    table.uuid('target_id').nullable();
    table.string('relation_type', 30).nullable();
  });

  await knex.raw(`
    ALTER TABLE ${MEMBERS_TABLE}
    ADD CONSTRAINT relationship_map_members_ref_check
    CHECK (
      (relationship_id IS NOT NULL AND source_type IS NULL AND source_id IS NULL AND target_type IS NULL AND target_id IS NULL AND relation_type IS NULL)
      OR
      (relationship_id IS NULL AND source_type IS NOT NULL AND source_id IS NOT NULL AND target_type IS NOT NULL AND target_id IS NOT NULL AND relation_type IS NOT NULL)
    )
  `);

  await knex.raw(`
    ALTER TABLE ${MEMBERS_TABLE}
    ADD CONSTRAINT relationship_map_members_source_type_check
    CHECK (source_type IS NULL OR source_type IN ('server', 'application', 'database', 'url', 'vip'))
  `);
  await knex.raw(`
    ALTER TABLE ${MEMBERS_TABLE}
    ADD CONSTRAINT relationship_map_members_target_type_check
    CHECK (target_type IS NULL OR target_type IN ('server', 'application', 'database', 'url', 'vip'))
  `);
  await knex.raw(`
    ALTER TABLE ${MEMBERS_TABLE}
    ADD CONSTRAINT relationship_map_members_relation_type_check
    CHECK (relation_type IS NULL OR relation_type IN ('hosts', 'depends_on', 'connects_to', 'exposes', 'consumes', 'part_of'))
  `);

  // Dedup for implicit members. Explicit members are already deduped by the
  // existing relationship_map_members_unique_active index on (map_id, relationship_id) —
  // NULLs there are never considered duplicates of each other, so it doesn't
  // interfere with implicit rows (which always have relationship_id NULL).
  await knex.raw(`
    CREATE UNIQUE INDEX relationship_map_members_implicit_unique_active
    ON ${MEMBERS_TABLE} (map_id, source_type, source_id, target_type, target_id, relation_type)
    WHERE deleted_at IS NULL AND relationship_id IS NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS relationship_map_members_implicit_unique_active`);
  await knex.raw(`ALTER TABLE ${MEMBERS_TABLE} DROP CONSTRAINT IF EXISTS relationship_map_members_relation_type_check`);
  await knex.raw(`ALTER TABLE ${MEMBERS_TABLE} DROP CONSTRAINT IF EXISTS relationship_map_members_target_type_check`);
  await knex.raw(`ALTER TABLE ${MEMBERS_TABLE} DROP CONSTRAINT IF EXISTS relationship_map_members_source_type_check`);
  await knex.raw(`ALTER TABLE ${MEMBERS_TABLE} DROP CONSTRAINT IF EXISTS relationship_map_members_ref_check`);

  await knex.schema.alterTable(MEMBERS_TABLE, (table) => {
    table.dropColumn('source_type');
    table.dropColumn('source_id');
    table.dropColumn('target_type');
    table.dropColumn('target_id');
    table.dropColumn('relation_type');
  });

  // Down assumes no implicit rows remain (they were dropped above); restoring
  // NOT NULL would fail otherwise, which is the right signal to stop a rollback.
  await knex.schema.alterTable(MEMBERS_TABLE, (table) => {
    table.uuid('relationship_id').notNullable().alter();
  });
}
