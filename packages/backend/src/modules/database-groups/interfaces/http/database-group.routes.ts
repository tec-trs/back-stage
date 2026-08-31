import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { DatabaseGroupController } from './database-group.controller.js';
import {
  addApplicationLinkSchema,
  addMemberSchema,
  createDatabaseGroupSchema,
  groupApplicationLinkParamSchema,
  groupIdParamSchema,
  groupMemberParamSchema,
  updateDatabaseGroupSchema,
} from './database-group.validation.js';

export function createDatabaseGroupRouter(controller: DatabaseGroupController): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler((req, res) => controller.listGroups(req, res)),
  );

  router.get(
    '/:groupId',
    validateMiddleware({ params: groupIdParamSchema }),
    asyncHandler((req, res) => controller.getGroup(req, res)),
  );

  router.post(
    '/',
    validateMiddleware({ body: createDatabaseGroupSchema }),
    asyncHandler((req, res) => controller.createGroup(req, res)),
  );

  router.put(
    '/:groupId',
    validateMiddleware({ params: groupIdParamSchema, body: updateDatabaseGroupSchema }),
    asyncHandler((req, res) => controller.updateGroup(req, res)),
  );

  router.delete(
    '/:groupId',
    validateMiddleware({ params: groupIdParamSchema }),
    asyncHandler((req, res) => controller.deleteGroup(req, res)),
  );

  router.post(
    '/:groupId/members',
    validateMiddleware({ params: groupIdParamSchema, body: addMemberSchema }),
    asyncHandler((req, res) => controller.addMember(req, res)),
  );

  router.delete(
    '/:groupId/members/:memberId',
    validateMiddleware({ params: groupMemberParamSchema }),
    asyncHandler((req, res) => controller.removeMember(req, res)),
  );

  router.post(
    '/:groupId/applications',
    validateMiddleware({ params: groupIdParamSchema, body: addApplicationLinkSchema }),
    asyncHandler((req, res) => controller.addApplicationLink(req, res)),
  );

  router.delete(
    '/:groupId/applications/:linkId',
    validateMiddleware({ params: groupApplicationLinkParamSchema }),
    asyncHandler((req, res) => controller.removeApplicationLink(req, res)),
  );

  return router;
}
