import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { SearchController } from './search.controller.js';
import { searchQuerySchema, suggestQuerySchema } from './search.validation.js';

export function createSearchRouter(controller: SearchController): Router {
  const router = Router();

  /**
   * @openapi
   * /search:
   *   get:
   *     summary: Busca full-text (PostgreSQL) no catalogo, com ranking, filtros e facets
   *     tags: [Search]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Resultado da busca, com facets por kind e lifecycle }
   */
  router.get(
    '/search',
    validateMiddleware({ query: searchQuerySchema }),
    asyncHandler(controller.search),
  );

  /**
   * @openapi
   * /suggestions:
   *   get:
   *     summary: Autocomplete/sugestoes por prefixo (PostgreSQL Full Text Search)
   *     tags: [Search]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Lista de sugestoes ordenadas por relevancia }
   */
  router.get(
    '/suggestions',
    validateMiddleware({ query: suggestQuerySchema }),
    asyncHandler(controller.suggest),
  );

  return router;
}
