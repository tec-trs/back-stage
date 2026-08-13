import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';

import type { HealthController } from './health.controller.js';

export function createHealthRouter(controller: HealthController): Router {
  const router = Router();

  /**
   * @openapi
   * /health:
   *   get:
   *     summary: Retorna o status de saude do backend e da conexao com o banco
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Status atual do backend
   */
  router.get('/health', asyncHandler(controller.getHealth));

  return router;
}
