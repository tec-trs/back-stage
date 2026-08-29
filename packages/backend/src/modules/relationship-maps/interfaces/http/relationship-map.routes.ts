import { Router } from 'express';

import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';

import type { RelationshipMapController } from './relationship-map.controller.js';
import {
  attachRelationshipSchema,
  createRelationshipMapSchema,
  mapIdParamSchema,
  mapRelationshipParamSchema,
  updateRelationshipMapSchema,
} from './relationship-map.validation.js';

export function createRelationshipMapRouter(controller: RelationshipMapController): Router {
  const router = Router();

  router.get(
    '/',
    asyncHandler((req, res) => controller.listMaps(req, res)),
  );

  router.get(
    '/:mapId',
    validateMiddleware({ params: mapIdParamSchema }),
    asyncHandler((req, res) => controller.getMap(req, res)),
  );

  router.post(
    '/',
    validateMiddleware({ body: createRelationshipMapSchema }),
    asyncHandler((req, res) => controller.createMap(req, res)),
  );

  router.put(
    '/:mapId',
    validateMiddleware({ params: mapIdParamSchema, body: updateRelationshipMapSchema }),
    asyncHandler((req, res) => controller.updateMap(req, res)),
  );

  router.delete(
    '/:mapId',
    validateMiddleware({ params: mapIdParamSchema }),
    asyncHandler((req, res) => controller.deleteMap(req, res)),
  );

  router.post(
    '/:mapId/relationships',
    validateMiddleware({ params: mapIdParamSchema, body: attachRelationshipSchema }),
    asyncHandler((req, res) => controller.attachRelationship(req, res)),
  );

  router.delete(
    '/:mapId/relationships/:relationshipId',
    validateMiddleware({ params: mapRelationshipParamSchema }),
    asyncHandler((req, res) => controller.detachRelationship(req, res)),
  );

  return router;
}
