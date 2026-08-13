import type {
  ISearchRepository,
  Pagination,
  SearchFacets,
  SearchFilters,
  SearchResultRow,
  SuggestionRow,
} from '../infrastructure/search.repository.js';

export interface SearchResult {
  items: SearchResultRow[];
  pagination: { page: number; pageSize: number; total: number };
  facets: SearchFacets;
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
}
