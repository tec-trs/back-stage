import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { ServerTypeController } from './server-type.controller.js';
import {
  createServerTypeBodySchema,
  serverTypeIdParamsSchema,
  updateServerTypeBodySchema,
} from './server-type.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createServerTypeRouter(controller: ServerTypeController): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.list));

  router.post(
    '/',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createServerTypeBodySchema }),
    asyncHandler(controller.create),
  );

  router.get(
    '/:id',
    validateMiddleware({ params: serverTypeIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authenticateMiddleware,
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: serverTypeIdParamsSchema, body: updateServerTypeBodySchema }),
    asyncHandler(controller.update),
  );

  router.delete(
    '/:id',
    authenticateMiddleware,
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: serverTypeIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}
