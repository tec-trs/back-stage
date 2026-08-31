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

const REFERENCING_TABLES: Array<{ table: string; column: string }> = [
  { table: 'servers', column: 'environment' },
  { table: 'deployments', column: 'environment' },
  { table: 'application_deployments', column: 'environment' },
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
