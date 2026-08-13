import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { ApplicationController } from './application.controller.js';
import {
  applicationIdParamsSchema,
  createApplicationBodySchema,
  listApplicationsQuerySchema,
  setApplicationStatusBodySchema,
  updateApplicationBodySchema,
} from './application.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createApplicationRouter(controller: ApplicationController): Router {
  const router = Router();

  /**
   * @openapi
   * /applications:
   *   get:
   *     summary: Lista aplicacoes com paginacao e filtros
   *     tags: [Applications]
   *     responses:
   *       200: { description: Lista paginada de aplicacoes }
   *   post:
   *     summary: Cadastra uma nova aplicacao
   *     tags: [Applications]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Aplicacao criada }
   *       409: { description: Ja existe uma aplicacao com este codigo }
   */
  router.get(
    '/',
    validateMiddleware({ query: listApplicationsQuerySchema }),
    asyncHandler(controller.list),
  );

  router.post(
    '/',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createApplicationBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /applications/{id}:
   *   get:
   *     summary: Obtem uma aplicacao pelo id
   *     tags: [Applications]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Aplicacao encontrada }
   *       404: { description: Aplicacao nao encontrada }
   *   put:
   *     summary: Atualiza uma aplicacao existente
   *     tags: [Applications]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Aplicacao atualizada }
   *   delete:
   *     summary: Remove (soft delete) uma aplicacao
   *     tags: [Applications]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Aplicacao removida }
   */
  router.get(
    '/:id',
    validateMiddleware({ params: applicationIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: applicationIdParamsSchema, body: updateApplicationBodySchema }),
    asyncHandler(controller.update),
  );

  /**
   * @openapi
   * /applications/{id}/status:
   *   put:
   *     summary: Altera o status da aplicacao
   *     tags: [Applications]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Status atualizado }
   */
  router.put(
    '/:id/status',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: applicationIdParamsSchema, body: setApplicationStatusBodySchema }),
    asyncHandler(controller.setStatus),
  );

  router.delete(
    '/:id',
    authenticateMiddleware,
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: applicationIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}
