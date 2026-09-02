import type { Knex } from 'knex';

import { orgContext } from '../../../shared/context/org-context.js';

const TABLE_NAME = 'catalog_entities';
const TS_CONFIG = 'portuguese';

export interface SearchFilters {
  kind?: string;
  lifecycle?: string;
  namespace?: string;
  type?: string;
}

export interface SearchResultRow {
  id: string;
  kind: string;
  type: string;
  name: string;
  namespace: string;
  title: string | null;
  description: string | null;
  lifecycle: string;
  rank: number;
}

export interface UnifiedSearchResultRow {
  id: string;
  resourceType: string;
  label: string;
  description: string | null;
  environment?: string;
  status?: string;
  rank: number;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface SearchFacets {
  kind: FacetCount[];
  lifecycle: FacetCount[];
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface SuggestionRow {
  id: string;
  kind: string;
  label: string;
}

export function buildPrefixTsQuery(rawQuery: string): string {
  const terms = rawQuery
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[&|!():'*]/g, ''))
    .filter(Boolean);

  return terms.map((term) => `${term}:*`).join(' & ');
}

export interface ISearchRepository {
  search(
    query: string,
    filters: SearchFilters,
    pagination: Pagination,
  ): Promise<{ items: SearchResultRow[]; total: number; facets: SearchFacets }>;
  suggest(query: string, limit: number): Promise<SuggestionRow[]>;
  unifiedSearch(
    query: string,
    tags?: string[],
    pagination?: Pagination,
    resourceType?: string,
  ): Promise<{ items: UnifiedSearchResultRow[]; total: number }>;
}

export class SearchRepository implements ISearchRepository {
  public constructor(private readonly db: Knex) {}

  private matchingRows(tsQuery: string): Knex.QueryBuilder {
    return this.db(TABLE_NAME)
      .where('organization_id', orgContext.getOrThrow())
      .whereNull('deleted_at')
      .whereRaw(`search_vector @@ to_tsquery('${TS_CONFIG}', ?)`, [tsQuery]);
  }

  public async search(
    query: string,
    filters: SearchFilters,
    pagination: Pagination,
  ): Promise<{ items: SearchResultRow[]; total: number; facets: SearchFacets }> {
    const tsQuery = buildPrefixTsQuery(query);

    if (!tsQuery) {
      return { items: [], total: 0, facets: { kind: [], lifecycle: [] } };
    }

    const filteredQuery = this.matchingRows(tsQuery);
    if (filters.kind) filteredQuery.andWhere('kind', filters.kind);
    if (filters.lifecycle) filteredQuery.andWhere('lifecycle', filters.lifecycle);
    if (filters.namespace) filteredQuery.andWhere('namespace', filters.namespace);
    if (filters.type) filteredQuery.andWhere('type', filters.type);

    const countQuery = filteredQuery.clone().clearSelect().count<{ count: string }[]>('* as count');

    const rowsQuery = filteredQuery
      .clone()
      .select(
        'id',
        'kind',
        'type',
        'name',
        'namespace',
        'title',
        'description',
        'lifecycle',
        this.db.raw(`ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) as rank`, [tsQuery]),
      )
      .orderBy('rank', 'desc')
      .limit(pagination.pageSize)
      .offset((pagination.page - 1) * pagination.pageSize);

    const kindFacetQuery = this.matchingRows(tsQuery)
      .select('kind as value')
      .count<{ value: string; count: string }[]>('* as count')
      .groupBy('kind');

    const lifecycleFacetQuery = this.matchingRows(tsQuery)
      .select('lifecycle as value')
      .count<{ value: string; count: string }[]>('* as count')
      .groupBy('lifecycle');

    const [countResult, rows, kindFacets, lifecycleFacets] = await Promise.all([
      countQuery,
      rowsQuery,
      kindFacetQuery,
      lifecycleFacetQuery,
    ]);

    return {
      items: rows as unknown as SearchResultRow[],
      total: Number(countResult[0]?.count ?? 0),
      facets: {
        kind: (kindFacets as unknown as { value: string; count: string }[]).map((row) => ({
          value: row.value,
          count: Number(row.count),
        })),
        lifecycle: (lifecycleFacets as unknown as { value: string; count: string }[]).map(
          (row) => ({ value: row.value, count: Number(row.count) }),
        ),
      },
    };
  }

  public async suggest(query: string, limit: number): Promise<SuggestionRow[]> {
    const tsQuery = buildPrefixTsQuery(query);
    if (!tsQuery) {
      return [];
    }

    const orgId = orgContext.getOrThrow();

    const [servers, applications, databases, urls] = await Promise.all([
      this.db.raw<{ rows: SuggestionRow[] }>(
        `SELECT id, 'server' AS kind, coalesce(display_name, hostname) AS label, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) AS rank FROM servers WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ORDER BY rank DESC LIMIT ?`,
        [tsQuery, orgId, tsQuery, limit],
      ),
      this.db.raw<{ rows: SuggestionRow[] }>(
        `SELECT id, 'application' AS kind, display_name AS label, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) AS rank FROM applications WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ORDER BY rank DESC LIMIT ?`,
        [tsQuery, orgId, tsQuery, limit],
      ),
      this.db.raw<{ rows: SuggestionRow[] }>(
        `SELECT id, 'database' AS kind, coalesce(display_name, name) AS label, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) AS rank FROM databases WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ORDER BY rank DESC LIMIT ?`,
        [tsQuery, orgId, tsQuery, limit],
      ),
      this.db.raw<{ rows: SuggestionRow[] }>(
        `SELECT id, 'url' AS kind, label, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) AS rank FROM urls WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ORDER BY rank DESC LIMIT ?`,
        [tsQuery, orgId, tsQuery, limit],
      ),
    ]);

    const allRows = [
      ...(servers.rows ?? []),
      ...(applications.rows ?? []),
      ...(databases.rows ?? []),
      ...(urls.rows ?? []),
    ].sort((a, b) => ((b as { rank?: number }).rank ?? 0) - ((a as { rank?: number }).rank ?? 0));

    return allRows.slice(0, limit);
  }

  public async unifiedSearch(
    query: string,
    tags?: string[],
    pagination?: Pagination,
    resourceType?: string,
  ): Promise<{ items: UnifiedSearchResultRow[]; total: number }> {
    const tsQuery = buildPrefixTsQuery(query);
    if (!tsQuery) {
      return { items: [], total: 0 };
    }

    const pageSize = pagination?.pageSize ?? 20;
    const page = pagination?.page ?? 1;
    const orgId = orgContext.getOrThrow();

    // Bind the tag list as a real array parameter instead of splicing it into
    // the SQL string — the previous version built `ARRAY['a','b']` by string
    // concatenation, which let a tag value break out of the literal.
    const tagsFilter = tags?.length ? 'AND tags && ?::text[]' : '';
    const tagsParam = tags?.length ? [tags] : [];

    const searchResults = await Promise.all([
      this.db.raw<{ rows: UnifiedSearchResultRow[] }>(
        `SELECT id, 'server' as "resourceType", coalesce(display_name, hostname) as label, description, environment, status, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) as rank FROM servers WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ${tagsFilter} ORDER BY rank DESC`,
        [tsQuery, orgId, tsQuery, ...tagsParam],
      ),
      this.db.raw<{ rows: UnifiedSearchResultRow[] }>(
        `SELECT id, 'application' as "resourceType", display_name as label, description, null::text as environment, status, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) as rank FROM applications WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ${tagsFilter} ORDER BY rank DESC`,
        [tsQuery, orgId, tsQuery, ...tagsParam],
      ),
      this.db.raw<{ rows: UnifiedSearchResultRow[] }>(
        `SELECT id, 'database' as "resourceType", display_name as label, description, environment, status, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) as rank FROM databases WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ${tagsFilter} ORDER BY rank DESC`,
        [tsQuery, orgId, tsQuery, ...tagsParam],
      ),
      this.db.raw<{ rows: UnifiedSearchResultRow[] }>(
        `SELECT id, 'url' as "resourceType", label, description, null::text as environment, status, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) as rank FROM urls WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ${tagsFilter} ORDER BY rank DESC`,
        [tsQuery, orgId, tsQuery, ...tagsParam],
      ),
      this.db.raw<{ rows: UnifiedSearchResultRow[] }>(
        `SELECT id, 'catalog_entity' as "resourceType", coalesce(title, name) as label, description, null::text as environment, null::text as status, ts_rank(search_vector, to_tsquery('${TS_CONFIG}', ?)) as rank FROM catalog_entities WHERE deleted_at IS NULL AND organization_id = ? AND search_vector @@ to_tsquery('${TS_CONFIG}', ?) ${tagsFilter} ORDER BY rank DESC`,
        [tsQuery, orgId, tsQuery, ...tagsParam],
      ),
    ]);

    let allItems = searchResults.flatMap(r => (Array.isArray(r) ? r : r.rows ?? [])).sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0));

    if (resourceType) {
      allItems = allItems.filter((item) => item.resourceType === resourceType);
    }

    const startIdx = (page - 1) * pageSize;
    const items = allItems.slice(startIdx, startIdx + pageSize);

    return {
      items,
      total: allItems.length,
    };
  }
}
