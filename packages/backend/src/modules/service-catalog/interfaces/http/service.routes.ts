import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { ServiceController } from './service.controller.js';
import {
  createServiceBodySchema,
  listServicesQuerySchema,
  searchServicesQuerySchema,
  serviceIdParamsSchema,
  updateServiceBodySchema,
} from './service.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createServiceRouter(controller: ServiceController): Router {
  const router = Router();

  /**
   * @openapi
   * /services/search:
   *   get:
   *     summary: Busca services por nome, titulo ou descricao
   *     tags: [Services]
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema: { type: string }
   *     responses:
   *       200: { description: Resultado da busca }
   */
  router.get(
    '/search',
    validateMiddleware({ query: searchServicesQuerySchema }),
    asyncHandler(controller.search),
  );

  /**
   * @openapi
   * /services:
   *   get:
   *     summary: Lista services com paginacao, filtros e ordenacao
   *     tags: [Services]
   *     responses:
   *       200: { description: Lista paginada de services }
   *   post:
   *     summary: Cria um novo service
   *     tags: [Services]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Service criado }
   *       409: { description: Service ja existe no namespace }
   */
  router.get(
    '/',
    validateMiddleware({ query: listServicesQuerySchema }),
    asyncHandler(controller.list),
  );

  router.post(
    '/',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createServiceBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /services/{id}:
   *   get:
   *     summary: Obtem um service pelo id
   *     tags: [Services]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Service encontrado }
   *       404: { description: Service nao encontrado }
   *   put:
   *     summary: Atualiza um service existente
   *     tags: [Services]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Service atualizado }
   *   delete:
   *     summary: Remove (soft delete) um service
   *     tags: [Services]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Service removido }
   */
  router.get(
    '/:id',
    validateMiddleware({ params: serviceIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: serviceIdParamsSchema, body: updateServiceBodySchema }),
    asyncHandler(controller.update),
  );

  router.delete(
    '/:id',
    authenticateMiddleware,
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: serviceIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}
