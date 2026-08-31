import type { Knex } from 'knex';

// The admin "Ambientes" screen only ever enforced uniqueness on `slug`
// (lowercase, validated client- and server-side) and never checked `name`
// case-insensitively — see environment.service.ts create()/update(), fixed
// alongside this migration. That let rows like slug='production'/name='Producao'
// and slug='producao2'/name='PRODUCAO' coexist as two "different" environments
// that mean the same thing to a person picking from the dropdown. This likely
// stayed hidden while `environments` was still organization-scoped (each org
// had its own copy) and only became visible once migration
// 20260831_remove_organization_id_from_teams_and_environments.ts unified it
// into one global catalog.
//
// This migration merges only UNAMBIGUOUS duplicates: rows whose `name`,
// trimmed and lowercased, are byte-identical (e.g. 'Producao' + 'PRODUCAO').
// It deliberately does NOT try to merge differently-spelled rows that might
// mean the same thing (e.g. 'DESENV' vs 'Desenvolvimento') — deciding those
// are the same environment needs a person, not a heuristic, so those are left
// alone for manual review in the Ambientes screen.
//
// For each duplicate group, the oldest row (by created_at) is kept as
// canonical. Every table that stores an environment as a free-text slug
// (there is no foreign key — see the tables below) gets any reference to a
// duplicate's slug repointed to the canonical slug before the duplicate rows
// are deleted.
//
// A few of those tables (application_deployments, at least) also have their
// own partial-unique index that includes `environment` in its key — e.g.
// application_deployments_unique_active on (application_id, server_id,
// environment) WHERE deleted_at IS NULL. If the *same* application was
// already deployed to the *same* server under both the canonical slug and
// the duplicate slug (a direct symptom of this same bug — someone picked the
// wrong duplicate in a dropdown), a blind UPDATE would violate that index.
// For tables that declare `identityColumns` below, rows that would collide
// are treated as genuine duplicate records and soft-deleted (or, if the
// table has no deleted_at column, left untouched and logged for manual
// review) instead of updated into a collision.

interface ReferencingTable {
  table: string;
  column: string;
  // Columns that, together with `column`, form a uniqueness key on this
  // table. When set, a row about to be repointed to the canonical slug is
  // first checked against rows that already share these columns under the
  // canonical slug — see resolveCollisions() below.
  identityColumns?: string[];
}

const REFERENCING_TABLES: ReferencingTable[] = [
  { table: 'servers', column: 'environment' },
  { table: 'deployments', column: 'environment' },
  { table: 'application_deployments', column: 'environment', identityColumns: ['application_id', 'server_id'] },
  { table: 'databases', column: 'environment' },
  { table: 'server_groups', column: 'environment' },
  { table: 'vips', column: 'environment' },
];

interface EnvironmentRow {
  id: string;
  slug: string;
  name: string;
  created_at: Date | string;
}

async function resolveCollisions(
  knex: Knex,
  ref: ReferencingTable,
  duplicateSlug: string,
  canonicalSlug: string,
): Promise<void> {
  if (!ref.identityColumns || ref.identityColumns.length === 0) return;

  const hasDeletedAt = await knex.schema.hasColumn(ref.table, 'deleted_at');
  const identityJoin = ref.identityColumns.map((col) => `dup.${col} = existing.${col}`).join(' AND ');
  const deletedAtFilter = hasDeletedAt ? 'AND dup.deleted_at IS NULL AND existing.deleted_at IS NULL' : '';

  const { rows: colliding } = await knex.raw(
    `SELECT dup.id FROM ${ref.table} dup
     JOIN ${ref.table} existing
       ON ${identityJoin}
      AND existing.${ref.column} = ?
      AND existing.id <> dup.id
     WHERE dup.${ref.column} = ?
     ${deletedAtFilter}`,
    [canonicalSlug, duplicateSlug],
  );

  if (colliding.length === 0) return;

  const ids = colliding.map((row: { id: string }) => row.id);

  if (hasDeletedAt) {
    // eslint-disable-next-line no-console
    console.log(
      `[merge-duplicate-environments]   ${ref.table}: ${ids.length} row(s) already exist under the canonical ` +
        `environment for the same ${ref.identityColumns.join('+')} — soft-deleting the duplicate row(s) instead ` +
        'of merging (would otherwise violate a unique index).',
    );
    await knex(ref.table).whereIn('id', ids).update({ deleted_at: knex.fn.now() });
  } else {
    // eslint-disable-next-line no-console
    console.warn(
      `[merge-duplicate-environments]   ${ref.table}: ${ids.length} row(s) (ids: ${ids.join(', ')}) collide with ` +
        `an existing row under the canonical environment for the same ${ref.identityColumns.join('+')}, and this ` +
        'table has no deleted_at column to safely resolve it automatically — left on the duplicate slug for ' +
        'manual review.',
    );
  }
}

export async function up(knex: Knex): Promise<void> {
  const hasEnvironments = await knex.schema.hasTable('environments');
  if (!hasEnvironments) return;

  const rows: EnvironmentRow[] = await knex('environments')
    .select('id', 'slug', 'name', 'created_at')
    .whereNull('deleted_at')
    .orderBy('created_at', 'asc');

  const groups = new Map<string, EnvironmentRow[]>();
  for (const row of rows) {
    const key = row.name.trim().toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  for (const [key, group] of groups) {
    if (group.length < 2) continue;

    const [canonical, ...duplicates] = group; // oldest first, already sorted by created_at
    // eslint-disable-next-line no-console
    console.log(
      `[merge-duplicate-environments] "${key}": keeping ${canonical.slug} (${canonical.name}); merging ` +
        duplicates.map((d) => `${d.slug} (${d.name})`).join(', '),
    );

    for (const dup of duplicates) {
      for (const ref of REFERENCING_TABLES) {
        const hasTable = await knex.schema.hasTable(ref.table);
        if (!hasTable) continue;
        const hasColumn = await knex.schema.hasColumn(ref.table, ref.column);
        if (!hasColumn) continue;

        await resolveCollisions(knex, ref, dup.slug, canonical.slug);

        await knex(ref.table).where(ref.column, dup.slug).update({ [ref.column]: canonical.slug });
      }
      await knex('environments').where('id', dup.id).delete();
    }
  }
}

export async function down(): Promise<void> {
  // Not reversible: the duplicate rows and each server/deployment/etc.'s
  // original (duplicate) environment slug are gone once merged. Restore
  // `environments` and the tables listed in REFERENCING_TABLES from a
  // backup taken before this migration ran if you need to undo it.
  throw new Error(
    'merge_duplicate_environments is not reversible — restore environments and the referencing tables from a backup.',
  );
}
