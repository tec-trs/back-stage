import type {
  ISearchRepository,
  Pagination,
  SearchFacets,
  SearchFilters,
  SearchResultRow,
  SuggestionRow,
  UnifiedSearchResultRow,
} from '../infrastructure/search.repository.js';

export interface SearchResult {
  items: SearchResultRow[];
  pagination: { page: number; pageSize: number; total: number };
  facets: SearchFacets;
}

export interface UnifiedSearchResult {
  items: UnifiedSearchResultRow[];
  pagination: { page: number; pageSize: number; total: number };
}

export class SearchService {
  public constructor(private readonly searchRepository: ISearchRepository) {}

  public async search(
    query: string,
    filters: SearchFilters,
    pagination: Pagination,
  ): Promise<SearchResult> {
    const { items, total, facets } = await this.searchRepository.search(query, filters, pagination);
    return { items, pagination: { ...pagination, total }, facets };
  }

  public async suggest(query: string, limit: number): Promise<SuggestionRow[]> {
    return this.searchRepository.suggest(query, limit);
  }

  public async unifiedSearch(
    query: string,
    tags?: string[],
    pagination?: Pagination,
  ): Promise<UnifiedSearchResult> {
    const { items, total } = await this.searchRepository.unifiedSearch(query, tags, pagination);
    return {
      items,
      pagination: { page: pagination?.page ?? 1, pageSize: pagination?.pageSize ?? 20, total },
    };
  }
}
