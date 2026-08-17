import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { EnvironmentController } from './environment.controller.js';
import {
  createEnvironmentBodySchema,
  environmentIdParamsSchema,
  updateEnvironmentBodySchema,
} from './environment.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createEnvironmentRouter(controller: EnvironmentController): Router {
  const router = Router();
  router.use(authenticateMiddleware);

  /**
   * @openapi
   * /environments:
   *   get:
   *     summary: Lista todos os ambientes
   *     tags: [Environments]
   *     responses:
   *       200: { description: Lista de ambientes }
   *   post:
   *     summary: Cadastra um novo ambiente
   *     tags: [Environments]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Ambiente criado }
   *       409: { description: Ja existe um ambiente com este slug }
   */
  router.get('/', asyncHandler(controller.list));

  router.post(
    '/',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createEnvironmentBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /environments/{id}:
   *   get:
   *     summary: Obtem um ambiente pelo id
   *     tags: [Environments]
   *   put:
   *     summary: Atualiza um ambiente existente
   *     tags: [Environments]
   *     security: [{ bearerAuth: [] }]
   *   delete:
   *     summary: Remove um ambiente
   *     tags: [Environments]
   *     security: [{ bearerAuth: [] }]
   */
  router.get(
    '/:id',
    validateMiddleware({ params: environmentIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: environmentIdParamsSchema, body: updateEnvironmentBodySchema }),
    asyncHandler(controller.update),
  );

  router.delete(
    '/:id',
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: environmentIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}
