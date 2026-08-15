import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { UserController } from './user.controller.js';
import {
  createUserBodySchema,
  listUsersQuerySchema,
  updateUserBodySchema,
  userIdParamsSchema,
} from './user.validation.js';

const ADMIN_ROLES = ['admin'];
const adminOnly = authorizeMiddleware(...ADMIN_ROLES);

export function createUserRouter(controller: UserController): Router {
  const router = Router();

  // Todas as rotas exigem autenticação; escrita exige role admin.
  router.use(authenticateMiddleware);

  /**
   * @openapi
   * /users:
   *   get:
   *     summary: Lista usuarios com paginacao e filtros
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Lista paginada de usuarios }
   *   post:
   *     summary: Cria um novo usuario
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Usuario criado }
   *       409: { description: Ja existe um usuario com este email }
   */
  router.get('/', validateMiddleware({ query: listUsersQuerySchema }), asyncHandler(controller.list));

  router.post(
    '/',
    adminOnly,
    validateMiddleware({ body: createUserBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /users/{id}:
   *   get:
   *     summary: Obtem um usuario pelo id
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Usuario encontrado }
   *       404: { description: Usuario nao encontrado }
   *   put:
   *     summary: Atualiza dados de um usuario existente
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Usuario atualizado }
   */
  router.get(
    '/:id',
    validateMiddleware({ params: userIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    adminOnly,
    validateMiddleware({ params: userIdParamsSchema, body: updateUserBodySchema }),
    asyncHandler(controller.update),
  );

  /**
   * @openapi
   * /users/{id}/deactivate:
   *   put:
   *     summary: Inativa um usuario, bloqueando seu acesso a aplicacao
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Usuario inativado }
   */
  router.put(
    '/:id/deactivate',
    adminOnly,
    validateMiddleware({ params: userIdParamsSchema }),
    asyncHandler(controller.deactivate),
  );

  /**
   * @openapi
   * /users/{id}/activate:
   *   put:
   *     summary: Reativa um usuario previamente inativado
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Usuario ativado }
   */
  router.put(
    '/:id/activate',
    adminOnly,
    validateMiddleware({ params: userIdParamsSchema }),
    asyncHandler(controller.activate),
  );

  /**
   * @openapi
   * /users/{id}:
   *   delete:
   *     summary: Remove (soft delete) um usuario
   *     tags: [Users]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Usuario removido }
   */
  router.delete(
    '/:id',
    adminOnly,
    validateMiddleware({ params: userIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}
