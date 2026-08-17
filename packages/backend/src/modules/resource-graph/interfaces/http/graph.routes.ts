import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { GraphController } from './graph.controller.js';
import {
  createRelationshipBodySchema,
  deleteRelationshipParamsSchema,
  getFullGraphQuerySchema,
  getSubgraphParamsSchema,
  getSubgraphQuerySchema,
  simulateImpactBodySchema,
} from './graph.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createGraphRouter(controller: GraphController): Router {
  const router = Router();

  /**
   * @openapi
   * /resource-graph:
   *   get:
   *     summary: Obtem o grafo completo de recursos com paginacao
   *     tags: [Resource Graph]
   *     responses:
   *       200: { description: Grafo de recursos }
   */
  router.get('/', validateMiddleware({ query: getFullGraphQuerySchema }), asyncHandler(controller.getFullGraph));

  /**
   * @openapi
   * /resource-graph/{type}/{id}/subgraph:
   *   get:
   *     summary: Obtem um subgrafo centrado em um recurso especifico
   *     tags: [Resource Graph]
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema: { type: string, enum: [server, application, database, url] }
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *       - in: query
   *         name: depth
   *         schema: { type: integer, minimum: 1, maximum: 10, default: 2 }
   *     responses:
   *       200: { description: Subgrafo encontrado }
   */
  router.get(
    '/:type/:id/subgraph',
    validateMiddleware({ params: getSubgraphParamsSchema, query: getSubgraphQuerySchema }),
    asyncHandler(controller.getSubgraph),
  );

  /**
   * @openapi
   * /resource-graph/simulate-impact:
   *   post:
   *     summary: Simula o impacto de desligar um recurso (blast radius)
   *     tags: [Resource Graph]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Resultado da analise de impacto }
   */
  router.post(
    '/simulate-impact',
    validateMiddleware({ body: simulateImpactBodySchema }),
    asyncHandler(controller.simulateImpact),
  );

  /**
   * @openapi
   * /resource-graph/relationships:
   *   post:
   *     summary: Cria um novo relacionamento entre recursos
   *     tags: [Resource Graph]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Relacionamento criado }
   */
  router.post(
    '/relationships',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createRelationshipBodySchema }),
    asyncHandler(controller.createRelationship),
  );

  /**
   * @openapi
   * /resource-graph/relationships/{relationshipId}:
   *   delete:
   *     summary: Remove um relacionamento entre recursos
   *     tags: [Resource Graph]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Relacionamento removido }
   */
  router.delete(
    '/relationships/:relationshipId',
    authenticateMiddleware,
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: deleteRelationshipParamsSchema }),
    asyncHandler(controller.deleteRelationship),
  );

  return router;
}
