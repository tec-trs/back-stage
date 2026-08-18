import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { ApplicationTypeController } from './application-type.controller.js';
import {
  applicationTypeIdParamsSchema,
  bulkDeleteBodySchema,
  createApplicationTypeBodySchema,
  updateApplicationTypeBodySchema,
} from './application-type.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin'];

export function createApplicationTypeRouter(controller: ApplicationTypeController): Router {
  const router = Router();

  router.use(authenticateMiddleware);

  router.get('/', asyncHandler(controller.list));

  router.post(
    '/',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createApplicationTypeBodySchema }),
    asyncHandler(controller.create),
  );

  router.get(
    '/:id',
    validateMiddleware({ params: applicationTypeIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: applicationTypeIdParamsSchema, body: updateApplicationTypeBodySchema }),
    asyncHandler(controller.update),
  );

  router.delete(
    '/:id',
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: applicationTypeIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  router.post(
    '/bulk-delete',
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ body: bulkDeleteBodySchema }),
    asyncHandler(controller.bulkRemove),
  );

  return router;
}
