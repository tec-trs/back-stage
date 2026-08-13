import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { ServerController } from './server.controller.js';
import {
  createServerBodySchema,
  listServersQuerySchema,
  serverIdParamsSchema,
  setServerStatusBodySchema,
  updateServerBodySchema,
} from './server.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createServerRouter(controller: ServerController): Router {
  const router = Router();

  /**
   * @openapi
   * /servers:
   *   get:
   *     summary: Lista servidores com paginacao e filtros
   *     tags: [Servers]
   *     responses:
   *       200: { description: Lista paginada de servidores }
   *   post:
   *     summary: Cadastra um novo servidor
   *     tags: [Servers]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Servidor criado }
   *       409: { description: Ja existe um servidor com este hostname }
   */
  router.get(
    '/',
    validateMiddleware({ query: listServersQuerySchema }),
    asyncHandler(controller.list),
  );

  router.post(
    '/',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createServerBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /servers/{id}:
   *   get:
   *     summary: Obtem um servidor pelo id
   *     tags: [Servers]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Servidor encontrado }
   *       404: { description: Servidor nao encontrado }
   *   put:
   *     summary: Atualiza um servidor existente
   *     tags: [Servers]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Servidor atualizado }
   *   delete:
   *     summary: Remove (soft delete) um servidor
   *     tags: [Servers]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Servidor removido }
   */
  router.get(
    '/:id',
    validateMiddleware({ params: serverIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: serverIdParamsSchema, body: updateServerBodySchema }),
    asyncHandler(controller.update),
  );

  /**
   * @openapi
   * /servers/{id}/status:
   *   put:
   *     summary: Altera o status operacional do servidor
   *     tags: [Servers]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Status atualizado }
   */
  router.put(
    '/:id/status',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: serverIdParamsSchema, body: setServerStatusBodySchema }),
    asyncHandler(controller.setStatus),
  );

  router.delete(
    '/:id',
    authenticateMiddleware,
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: serverIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}
