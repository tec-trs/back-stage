import { Router } from 'express';
import { asyncHandler } from '../../../../shared/http/async-handler.js';
import { authenticateMiddleware } from '../../../../shared/http/authenticate.middleware.js';
import { validateMiddleware } from '../../../../shared/http/validate.middleware.js';
import type { ArchitectureDiagramController } from './architecture-diagram.controller.js';
import {
  createArchitectureDiagramBodySchema,
  updateArchitectureDiagramBodySchema,
  architectureDiagramIdParamsSchema,
} from './architecture-diagram.validation.js';

export function createArchitectureDiagramRouter(controller: ArchitectureDiagramController): Router {
  const router = Router();

  router.use(authenticateMiddleware);

  router.get('/', asyncHandler(controller.list));

  router.get(
    '/:id',
    validateMiddleware({ params: architectureDiagramIdParamsSchema }),
    asyncHandler(controller.getById)
  );

  router.post(
    '/',
    validateMiddleware({ body: createArchitectureDiagramBodySchema }),
    asyncHandler(controller.create)
  );

  router.put(
    '/:id',
    validateMiddleware({ params: architectureDiagramIdParamsSchema, body: updateArchitectureDiagramBodySchema }),
    asyncHandler(controller.update)
  );

  router.delete(
    '/:id',
    validateMiddleware({ params: architectureDiagramIdParamsSchema }),
    asyncHandler(controller.delete)
  );

  return router;
}
