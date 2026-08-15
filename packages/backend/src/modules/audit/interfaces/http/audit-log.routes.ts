import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { AuditLogController } from './audit-log.controller.js';
import { deleteAuditLogsBodySchema, listAuditLogsQuerySchema } from './audit-log.validation.js';

const READ_ROLES = ['admin', 'maintainer'];
const WRITE_ROLES = ['admin'];

export function createAuditLogRouter(controller: AuditLogController): Router {
  const router = Router();

  router.get(
    '/',
    authenticateMiddleware,
    authorizeMiddleware(...READ_ROLES),
    validateMiddleware({ query: listAuditLogsQuerySchema }),
    asyncHandler(controller.list),
  );

  router.delete(
    '/',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: deleteAuditLogsBodySchema }),
    asyncHandler(controller.deleteMany),
  );

  return router;
}
