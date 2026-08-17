import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';

import type { EcosystemGraphController } from './ecosystem-graph.controller.js';

export function createEcosystemGraphRouter(controller: EcosystemGraphController): Router {
  const router = Router();
  router.use(authenticateMiddleware);

  /**
   * @openapi
   * /ecosystem/graph:
   *   get:
   *     summary: Retorna o grafo do ecossistema (servidores, aplicacoes e seus relacionamentos)
   *     tags: [Ecosystem]
   *     responses:
   *       200: { description: Grafo completo do ecossistema }
   */
  router.get('/graph', asyncHandler(controller.getGraph));

  return router;
}
