import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { UrlController } from './url.controller.js';
import {
  createUrlBodySchema,
  listUrlsQuerySchema,
  setUrlStatusBodySchema,
  updateUrlBodySchema,
  urlIdParamsSchema,
} from './url.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createUrlRouter(controller: UrlController): Router {
  const router = Router();
  router.use(authenticateMiddleware);

  /**
   * @openapi
   * /urls:
   *   get:
   *     summary: Lista URLs com paginacao e filtros
   *     tags: [URLs]
   *     responses:
   *       200: { description: Lista paginada de URLs }
   *   post:
   *     summary: Cadastra uma nova URL
   *     tags: [URLs]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: URL criada }
   *       409: { description: Ja existe uma URL com este endereco }
   */
  router.get('/', validateMiddleware({ query: listUrlsQuerySchema }), asyncHandler(controller.list));

  router.post(
    '/',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createUrlBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /urls/{id}:
   *   get:
   *     summary: Obtem uma URL pelo id
   *     tags: [URLs]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: URL encontrada }
   *       404: { description: URL nao encontrada }
   *   put:
   *     summary: Atualiza uma URL existente
   *     tags: [URLs]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: URL atualizada }
   *   delete:
   *     summary: Remove (soft delete) uma URL
   *     tags: [URLs]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: URL removida }
   */
  router.get('/:id', validateMiddleware({ params: urlIdParamsSchema }), asyncHandler(controller.getById));

  router.put(
    '/:id',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: urlIdParamsSchema, body: updateUrlBodySchema }),
    asyncHandler(controller.update),
  );

  /**
   * @openapi
   * /urls/{id}/status:
   *   put:
   *     summary: Altera o status da URL
   *     tags: [URLs]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Status atualizado }
   */
  router.put(
    '/:id/status',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: urlIdParamsSchema, body: setUrlStatusBodySchema }),
    asyncHandler(controller.setStatus),
  );

  router.delete(
    '/:id',
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: urlIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}
