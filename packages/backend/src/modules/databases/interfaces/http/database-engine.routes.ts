import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { DatabaseEngineController } from './database-engine.controller.js';
import {
  createDatabaseEngineBodySchema,
  databaseEngineIdParamsSchema,
  updateDatabaseEngineBodySchema,
} from './database-engine.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createDatabaseEngineRouter(controller: DatabaseEngineController): Router {
  const router = Router();

  router.get('/engines', asyncHandler(controller.list));
  router.get('/engines/active', asyncHandler(controller.listActive));
  router.get(
    '/engines/:id',
    validateMiddleware({ params: databaseEngineIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.post(
    '/engines',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createDatabaseEngineBodySchema }),
    asyncHandler(controller.create),
  );

  router.put(
    '/engines/:id',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: databaseEngineIdParamsSchema, body: updateDatabaseEngineBodySchema }),
    asyncHandler(controller.update),
  );

  router.delete(
    '/engines/:id',
    authenticateMiddleware,
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: databaseEngineIdParamsSchema }),
    asyncHandler(controller.delete),
  );

  return router;
}
