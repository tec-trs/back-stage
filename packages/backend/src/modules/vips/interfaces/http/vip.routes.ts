import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { VIPController } from './vip.controller.js';
import {
  createVIPSchema,
  updateVIPSchema,
  addServerSchema,
  vipIdParamSchema,
  vipServerParamSchema,
} from './vip.validation.js';

export function createVIPRouter(controller: VIPController): Router {
  const router = Router();

  // CRUD de VIPs
  router.get(
    '/',
    asyncHandler((req, res) => controller.listVIPs(req, res)),
  );

  router.get(
    '/:id',
    validateMiddleware({ params: vipIdParamSchema }),
    asyncHandler((req, res) => controller.getVIP(req, res)),
  );

  router.post(
    '/',
    validateMiddleware({ body: createVIPSchema }),
    asyncHandler((req, res) => controller.createVIP(req, res)),
  );

  router.put(
    '/:id',
    validateMiddleware({ params: vipIdParamSchema, body: updateVIPSchema }),
    asyncHandler((req, res) => controller.updateVIP(req, res)),
  );

  router.delete(
    '/:id',
    validateMiddleware({ params: vipIdParamSchema }),
    asyncHandler((req, res) => controller.deleteVIP(req, res)),
  );

  // Gerenciamento de Servidores
  router.get(
    '/:id/servers',
    validateMiddleware({ params: vipIdParamSchema }),
    asyncHandler((req, res) => controller.getVIPServers(req, res)),
  );

  router.post(
    '/:id/servers',
    validateMiddleware({ params: vipIdParamSchema, body: addServerSchema }),
    asyncHandler((req, res) => controller.addServer(req, res)),
  );

  router.delete(
    '/:id/servers/:serverId',
    validateMiddleware({ params: vipServerParamSchema }),
    asyncHandler((req, res) => controller.removeServer(req, res)),
  );

  return router;
}
