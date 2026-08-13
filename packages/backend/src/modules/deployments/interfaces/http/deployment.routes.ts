import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { DeploymentController } from './deployment.controller.js';
import {
  createDeploymentBodySchema,
  deploymentIdParamsSchema,
  listDeploymentsQuerySchema,
} from './deployment.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];

export function createDeploymentRouter(controller: DeploymentController): Router {
  const router = Router();

  /**
   * @openapi
   * /deployments:
   *   get:
   *     summary: Lista deployments com paginacao e filtros
   *     tags: [Deployments]
   *     responses:
   *       200: { description: Lista paginada de deployments }
   *   post:
   *     summary: Registra manualmente o inicio de um deployment
   *     tags: [Deployments]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       201: { description: Deployment registrado }
   */
  router.get(
    '/',
    validateMiddleware({ query: listDeploymentsQuerySchema }),
    asyncHandler(controller.list),
  );
  router.post(
    '/',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createDeploymentBodySchema }),
    asyncHandler(controller.create),
  );

  /**
   * @openapi
   * /deployments/{id}:
   *   get:
   *     summary: Obtem um deployment pelo id
   *     tags: [Deployments]
   *     responses:
   *       200: { description: Deployment encontrado }
   *       404: { description: Deployment nao encontrado }
   */
  router.get(
    '/:id',
    validateMiddleware({ params: deploymentIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  return router;
}
