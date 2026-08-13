import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { AuditLogController } from './audit-log.controller.js';
import { listAuditLogsQuerySchema } from './audit-log.validation.js';

const READ_ROLES = ['admin', 'maintainer'];

export function createAuditLogRouter(controller: AuditLogController): Router {
  const router = Router();

  /**
   * @openapi
   * /audit-logs:
   *   get:
   *     summary: Lista o trilha de auditoria (audit trail) da plataforma
   *     tags: [Audit]
   *     security: [{ bearerAuth: [] }]
   *     responses:
   *       200: { description: Lista paginada de eventos de auditoria }
   */
  router.get(
    '/',
    authenticateMiddleware,
    authorizeMiddleware(...READ_ROLES),
    validateMiddleware({ query: listAuditLogsQuerySchema }),
    asyncHandler(controller.list),
  );

  return router;
}
