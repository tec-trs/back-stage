import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { CatalogEntityController } from './catalog-entity.controller.js';
import {
  catalogEntityIdParamsSchema,
  listCatalogEntitiesQuerySchema,
} from './catalog-entity.validation.js';

export function createCatalogEntityRouter(controller: CatalogEntityController): Router {
  const router = Router();

  /**
   * @openapi
   * /catalog-entities:
   *   get:
   *     summary: Lista entidades do catalogo (services, apis, resources, systems, domains)
   *     tags: [Catalog]
   *     responses:
   *       200: { description: Lista paginada de entidades do catalogo }
   */
  router.get(
    '/',
    validateMiddleware({ query: listCatalogEntitiesQuerySchema }),
    asyncHandler(controller.list),
  );

  /**
   * @openapi
   * /catalog-entities/{id}:
   *   get:
   *     summary: Obtem uma entidade do catalogo pelo id
   *     tags: [Catalog]
   *     responses:
   *       200: { description: Entidade encontrada }
   *       404: { description: Entidade nao encontrada }
   */
  router.get(
    '/:id',
    validateMiddleware({ params: catalogEntityIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  return router;
}
