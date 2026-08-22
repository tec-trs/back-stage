import { describe, expect, it, vi } from 'vitest';

import type {
  ISearchRepository,
  Pagination,
  SearchFacets,
  SearchFilters,
  SearchResultRow,
} from '../infrastructure/search.repository.js';

import { SearchService } from './search.service.js';

function buildSearchResult(
  overrides: Partial<SearchResultRow> = {},
): SearchResultRow {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    kind: 'service',
    type: 'service',
    name: 'backend-api',
    namespace: 'default',
    title: 'Backend API',
    description: 'Test service',
    lifecycle: 'production',
    rank: 1,
    ...overrides,
  };
}

function buildRepositoryMock(
  overrides: Partial<ISearchRepository> = {},
): ISearchRepository {
  return {
    search: vi.fn(),
    suggest: vi.fn(),
    unifiedSearch: vi.fn(),
    ...overrides,
  };
}

describe('SearchService', () => {
  it('returns resources matching search term', async () => {
    const mockResults = [buildSearchResult(), buildSearchResult({ id: '22222222-2222-2222-2222-222222222222' })];
    const repository = buildRepositoryMock({
      search: vi.fn().mockResolvedValue({
        items: mockResults,
        total: 2,
        facets: { kind: [], lifecycle: [] },
      }),
    });

    const service = new SearchService(repository);
    const filters: SearchFilters = {};
    const pagination: Pagination = { page: 1, pageSize: 20 };

    const result = await service.search('backend', filters, pagination);

    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toBe('backend-api');
    expect(result.pagination.total).toBe(2);
    expect(repository.search).toHaveBeenCalledWith('backend', filters, pagination);
  });

  it('filters by resource type', async () => {
    const mockResults = [buildSearchResult({ kind: 'database' })];
    const repository = buildRepositoryMock({
      search: vi.fn().mockResolvedValue({
        items: mockResults,
        total: 1,
        facets: { kind: [{ value: 'database', count: 1 }], lifecycle: [] },
      }),
    });

    const service = new SearchService(repository);
    const filters: SearchFilters = { kind: 'database' };
    const pagination: Pagination = { page: 1, pageSize: 20 };

    const result = await service.search('test', filters, pagination);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].kind).toBe('database');
    expect(result.facets.kind).toHaveLength(1);
    expect(repository.search).toHaveBeenCalledWith('test', filters, pagination);
  });

  it('returns empty array for no matches', async () => {
    const repository = buildRepositoryMock({
      search: vi.fn().mockResolvedValue({
        items: [],
        total: 0,
        facets: { kind: [], lifecycle: [] },
      }),
    });

    const service = new SearchService(repository);
    const filters: SearchFilters = {};
    const pagination: Pagination = { page: 1, pageSize: 20 };

    const result = await service.search('nonexistent', filters, pagination);

    expect(result.items).toHaveLength(0);
    expect(result.pagination.total).toBe(0);
    expect(result.facets.kind).toHaveLength(0);
  });
});
