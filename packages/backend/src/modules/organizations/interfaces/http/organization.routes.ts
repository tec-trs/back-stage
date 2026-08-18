import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { OrganizationController } from './organization.controller.js';
import {
  createOrgBodySchema,
  orgIdParamsSchema,
  updateOrgBodySchema,
} from './organization.validation.js';

const ADMIN = ['admin'];

export function createOrganizationRouter(controller: OrganizationController): Router {
  const router = Router();
  router.use(authenticateMiddleware);

  router.get('/', asyncHandler(controller.list));

  router.post(
    '/',
    authorizeMiddleware(...ADMIN),
    validateMiddleware({ body: createOrgBodySchema }),
    asyncHandler(controller.create),
  );

  router.get(
    '/:id',
    validateMiddleware({ params: orgIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authorizeMiddleware(...ADMIN),
    validateMiddleware({ params: orgIdParamsSchema, body: updateOrgBodySchema }),
    asyncHandler(controller.update),
  );

  router.delete(
    '/:id',
    authorizeMiddleware(...ADMIN),
    validateMiddleware({ params: orgIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  return router;
}
