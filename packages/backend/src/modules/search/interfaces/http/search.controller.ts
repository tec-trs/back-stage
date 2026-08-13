import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { SearchService } from '../../application/search.service.js';

import type { searchQuerySchema, suggestQuerySchema } from './search.validation.js';

type SearchQuery = z.infer<typeof searchQuerySchema>;
type SuggestQuery = z.infer<typeof suggestQuerySchema>;

export class SearchController {
  public constructor(private readonly searchService: SearchService) {}

  public search = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as SearchQuery;
    const result = await this.searchService.search(
      query.q,
      {
        kind: query.kind,
        lifecycle: query.lifecycle,
        namespace: query.namespace,
        type: query.type,
      },
      { page: query.page, pageSize: query.pageSize },
    );
    response.status(200).json(result);
  };

  public suggest = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as SuggestQuery;
    const suggestions = await this.searchService.suggest(query.q, query.limit);
    response.status(200).json({ items: suggestions });
  };
}
