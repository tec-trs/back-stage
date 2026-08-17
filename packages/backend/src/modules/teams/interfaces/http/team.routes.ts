import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { TeamController } from './team.controller.js';
import {
  addMemberBodySchema,
  createTeamBodySchema,
  memberParamsSchema,
  teamIdParamsSchema,
  updateMemberRoleBodySchema,
  updateTeamBodySchema,
} from './team.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const ADMIN_ROLES = ['admin'];

export function createTeamRouter(controller: TeamController): Router {
  const router = Router();

  router.use(authenticateMiddleware);

  router.get('/', asyncHandler(controller.list));

  router.post(
    '/',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createTeamBodySchema }),
    asyncHandler(controller.create),
  );

  router.get(
    '/:id',
    validateMiddleware({ params: teamIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: teamIdParamsSchema, body: updateTeamBodySchema }),
    asyncHandler(controller.update),
  );

  router.delete(
    '/:id',
    authorizeMiddleware(...ADMIN_ROLES),
    validateMiddleware({ params: teamIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  // Member management
  router.post(
    '/:id/members',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: teamIdParamsSchema, body: addMemberBodySchema }),
    asyncHandler(controller.addMember),
  );

  router.delete(
    '/:id/members/:userId',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: memberParamsSchema }),
    asyncHandler(controller.removeMember),
  );

  router.patch(
    '/:id/members/:userId',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: memberParamsSchema, body: updateMemberRoleBodySchema }),
    asyncHandler(controller.updateMemberRole),
  );

  return router;
}
