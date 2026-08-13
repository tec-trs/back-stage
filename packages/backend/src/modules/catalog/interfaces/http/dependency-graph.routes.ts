import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';

import type { DependencyGraphController } from './dependency-graph.controller.js';

export function createDependencyGraphRouter(controller: DependencyGraphController): Router {
  const router = Router();

  /**
   * @openapi
   * /catalog-entities/graph:
   *   get:
   *     summary: Retorna o grafo de dependencias (nodes e edges) do catalogo
   *     tags: [Catalog]
   *     responses:
   *       200: { description: Grafo de dependencias completo }
   */
  router.get('/graph', asyncHandler(controller.getGraph));

  return router;
}
