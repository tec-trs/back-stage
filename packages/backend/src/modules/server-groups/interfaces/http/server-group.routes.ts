import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { ServerGroupController } from './server-group.controller.js';
import {
  createServerGroupSchema,
  updateServerGroupSchema,
  addGroupMemberSchema,
  groupIdParamSchema,
  memberParamSchema,
} from './server-group.validation.js';

export function createServerGroupRouter(controller: ServerGroupController): Router {
  const router = Router();

  // CRUD de Grupos
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
    validateMiddleware({ body: createServerGroupSchema }),
    asyncHandler((req, res) => controller.createGroup(req, res)),
  );

  router.put(
    '/:groupId',
    validateMiddleware({ params: groupIdParamSchema, body: updateServerGroupSchema }),
    asyncHandler((req, res) => controller.updateGroup(req, res)),
  );

  router.delete(
    '/:groupId',
    validateMiddleware({ params: groupIdParamSchema }),
    asyncHandler((req, res) => controller.deleteGroup(req, res)),
  );

  // Gerenciamento de Membros
  router.get(
    '/:groupId/members',
    validateMiddleware({ params: groupIdParamSchema }),
    asyncHandler((req, res) => controller.getGroupMembers(req, res)),
  );

  router.post(
    '/:groupId/members',
    validateMiddleware({ params: groupIdParamSchema, body: addGroupMemberSchema }),
    asyncHandler((req, res) => controller.addMember(req, res)),
  );

  router.delete(
    '/:groupId/members/:serverId',
    validateMiddleware({ params: memberParamSchema }),
    asyncHandler((req, res) => controller.removeMember(req, res)),
  );

  return router;
}
