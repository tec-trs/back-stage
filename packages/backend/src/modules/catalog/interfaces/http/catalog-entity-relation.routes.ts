import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { CatalogEntityRelationController } from './catalog-entity-relation.controller.js';
import {
  createRelationSchema,
  deleteRelationParamsSchema,
  getRelationsBySourceParamsSchema,
  getRelationsByTargetParamsSchema,
} from './catalog-entity-relation.validation.js';

export function createCatalogEntityRelationRouter(
  controller: CatalogEntityRelationController,
): Router {
  const router = Router();

  /**
   * @openapi
   * /catalog-entities/relations:
   *   post:
   *     summary: Cria um novo relacionamento entre duas entidades
   *     tags: [Catalog]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               sourceEntityId:
   *                 type: string
   *                 format: uuid
   *               targetEntityId:
   *                 type: string
   *                 format: uuid
   *               relationType:
   *                 type: string
   *                 enum: ['dependsOn', 'dependencyOf', 'partOf', 'hasPart', 'providesApi', 'consumesApi']
   *     responses:
   *       201: { description: Relacionamento criado com sucesso }
   *       400: { description: Dados inválidos }
   */
  router.post(
    '/relations',
    validateMiddleware({ body: createRelationSchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /catalog-entities/relations/{sourceId}/{targetId}/{relationType}:
   *   delete:
   *     summary: Remove um relacionamento entre duas entidades
   *     tags: [Catalog]
   *     parameters:
   *       - in: path
   *         name: sourceId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: path
   *         name: targetId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: path
   *         name: relationType
   *         required: true
   *         schema:
   *           type: string
   *           enum: ['dependsOn', 'dependencyOf', 'partOf', 'hasPart', 'providesApi', 'consumesApi']
   *     responses:
   *       204: { description: Relacionamento removido com sucesso }
   *       404: { description: Relacionamento não encontrado }
   */
  router.delete(
    '/relations/:sourceId/:targetId/:relationType',
    validateMiddleware({ params: deleteRelationParamsSchema }),
    asyncHandler(controller.delete),
  );

  /**
   * @openapi
   * /catalog-entities/{sourceId}/relations/outgoing:
   *   get:
   *     summary: Retorna todos os relacionamentos de uma entidade (dependências que ela tem)
   *     tags: [Catalog]
   *     parameters:
   *       - in: path
   *         name: sourceId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200: { description: Lista de relacionamentos }
   */
  router.get(
    '/:sourceId/relations/outgoing',
    validateMiddleware({ params: getRelationsBySourceParamsSchema }),
    asyncHandler(controller.getBySource),
  );

  /**
   * @openapi
   * /catalog-entities/{targetId}/relations/incoming:
   *   get:
   *     summary: Retorna todos os relacionamentos que apontam para uma entidade (dependências que ela tem)
   *     tags: [Catalog]
   *     parameters:
   *       - in: path
   *         name: targetId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200: { description: Lista de relacionamentos }
   */
  router.get(
    '/:targetId/relations/incoming',
    validateMiddleware({ params: getRelationsByTargetParamsSchema }),
    asyncHandler(controller.getByTarget),
  );

  return router;
}
