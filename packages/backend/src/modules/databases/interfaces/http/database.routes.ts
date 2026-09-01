import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { DatabaseController } from './database.controller.js';
import {
  bulkDeleteDatabasesBodySchema,
  createDatabaseBodySchema,
  createDatabasePortBodySchema,
  databaseIdParamsSchema,
  listDatabasesQuerySchema,
  portIdParamsSchema,
  setDatabaseStatusBodySchema,
  updateDatabaseBodySchema,
  updateDatabasePortBodySchema,
} from './database.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createDatabaseRouter(controller: DatabaseController): Router {
  const router = Router();
  router.use(authenticateMiddleware);

  /**
   * @openapi
   * /databases:
   *   get:
   *     summary: Lista bancos de dados com paginacao e filtros
   *     tags: [Databases]
   *     responses:
   *       200: { description: Lista paginada de bancos de dados }
   *   post:
   *     summary: Cadastra um novo banco de dados
   *     tags: [Databases]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Banco de dados criado }
   *       409: { description: Ja existe um banco com este nome }
   */
  router.get(
    '/',
    validateMiddleware({ query: listDatabasesQuerySchema }),
    asyncHandler(controller.list),
  );

  router.post(
    '/',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createDatabaseBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /databases/bulk-delete:
   *   post:
   *     summary: Remove (soft delete) multiplos bancos de dados
   *     tags: [Databases]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Bancos de dados removidos }
   */
  router.post(
    '/bulk-delete',
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ body: bulkDeleteDatabasesBodySchema }),
    asyncHandler(controller.bulkDelete),
  );

  /**
   * @openapi
   * /databases/{id}:
   *   get:
   *     summary: Obtem um banco de dados pelo id
   *     tags: [Databases]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema: { type: string, format: uuid }
   *     responses:
   *       200: { description: Banco de dados encontrado }
   *       404: { description: Banco de dados nao encontrado }
   *   put:
   *     summary: Atualiza um banco de dados existente
   *     tags: [Databases]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Banco de dados atualizado }
   *   delete:
   *     summary: Remove (soft delete) um banco de dados
   *     tags: [Databases]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Banco de dados removido }
   */
  router.get(
    '/:id',
    validateMiddleware({ params: databaseIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: databaseIdParamsSchema, body: updateDatabaseBodySchema }),
    asyncHandler(controller.update),
  );

  /**
   * @openapi
   * /databases/{id}/status:
   *   put:
   *     summary: Altera o status do banco de dados
   *     tags: [Databases]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Status atualizado }
   */
  router.put(
    '/:id/status',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: databaseIdParamsSchema, body: setDatabaseStatusBodySchema }),
    asyncHandler(controller.setStatus),
  );

  router.delete(
    '/:id',
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: databaseIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}

  /**
   * @openapi
   * /databases/{id}/ports:
   *   get:
   *     summary: Lista as portas configuradas para um banco de dados
   *     tags: [Databases]
   *     responses:
   *       200: { description: Lista de portas }
   *   post:
   *     summary: Adiciona uma nova porta ao banco de dados
   *     tags: [Databases]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Porta adicionada }
   *       409: { description: Ja existe uma porta com este numero }
   */
  router.get(
    '/:id/ports',
    validateMiddleware({ params: databaseIdParamsSchema }),
    asyncHandler(controller.getPortsByDatabaseId),
  );

  router.post(
    '/:id/ports',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: databaseIdParamsSchema, body: createDatabasePortBodySchema }),
    asyncHandler(controller.addDatabasePort),
  );

  /**
   * @openapi
   * /databases/{id}/ports/{portId}:
   *   put:
   *     summary: Atualiza uma porta do banco de dados
   *     tags: [Databases]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Porta atualizada }
   *   delete:
   *     summary: Remove uma porta do banco de dados
   *     tags: [Databases]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       204: { description: Porta removida }
   */
  router.put(
    '/:id/ports/:portId',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: portIdParamsSchema, body: updateDatabasePortBodySchema }),
    asyncHandler(controller.updateDatabasePort),
  );

  router.delete(
    '/:id/ports/:portId',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: portIdParamsSchema }),
    asyncHandler(controller.removeDatabasePort),
  );
