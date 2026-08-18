import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { AuthController } from './auth.controller.js';
import { loginBodySchema, selectOrgBodySchema, switchOrgBodySchema } from './auth.validation.js';

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post(
    '/login',
    validateMiddleware({ body: loginBodySchema }),
    asyncHandler(controller.login),
  );

  router.post(
    '/select-org',
    validateMiddleware({ body: selectOrgBodySchema }),
    asyncHandler(controller.selectOrg),
  );

  router.post(
    '/switch-org',
    authenticateMiddleware,
    validateMiddleware({ body: switchOrgBodySchema }),
    asyncHandler(controller.switchOrg),
  );

  router.get('/me', authenticateMiddleware, controller.me);

  return router;
}
