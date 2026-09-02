import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authorizeMiddleware } from '../../../../shared/http/authorize.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { RelationshipRegistrationController } from './relationship-registration.controller.js';
import {
  addRelationshipBodySchema,
  addRelationshipParamsSchema,
  createRelationshipRegistrationBodySchema,
  registrationIdParamsSchema,
  relationshipParamsSchema,
  updateRelationshipRegistrationBodySchema,
} from './relationship-registration.validation.js';

const WRITE_ROLES = ['admin', 'maintainer'];
const DELETE_ROLES = ['admin', 'maintainer'];

export function createRelationshipRegistrationRouter(
  controller: RelationshipRegistrationController,
): Router {
  const router = Router();

  router.get('/', asyncHandler(controller.list));

  router.post(
    '/',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ body: createRelationshipRegistrationBodySchema }),
    asyncHandler(controller.create),
  );

  router.get(
    '/:id',
    validateMiddleware({ params: registrationIdParamsSchema }),
    asyncHandler(controller.getById),
  );

  router.put(
    '/:id',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: registrationIdParamsSchema, body: updateRelationshipRegistrationBodySchema }),
    asyncHandler(controller.update),
  );

  router.delete(
    '/:id',
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: registrationIdParamsSchema }),
    asyncHandler(controller.remove),
  );

  router.post(
    '/:registrationId/relationships',
    authorizeMiddleware(...WRITE_ROLES),
    validateMiddleware({ params: addRelationshipParamsSchema, body: addRelationshipBodySchema }),
    asyncHandler(controller.addRelationship),
  );

  router.delete(
    '/:registrationId/relationships/:relationshipId',
    authorizeMiddleware(...DELETE_ROLES),
    validateMiddleware({ params: relationshipParamsSchema }),
    asyncHandler(controller.removeRelationship),
  );

  return router;
}
