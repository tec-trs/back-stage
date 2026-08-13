import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { DeploymentTrackingService } from './application/deployment-tracking.service.js';
import { DeploymentService } from './application/deployment.service.js';
import { CatalogEntityLookupRepository } from './infrastructure/catalog-entity-lookup.repository.js';
import { DeploymentRepository } from './infrastructure/deployment.repository.js';
import { DeploymentController } from './interfaces/http/deployment.controller.js';
import { createDeploymentRouter } from './interfaces/http/deployment.routes.js';
import { WebhookController } from './interfaces/http/webhook.controller.js';
import { createWebhookRouter } from './interfaces/http/webhook.routes.js';

export function registerDeploymentsModule(): Router {
  container.register('DeploymentRepository', () => new DeploymentRepository(db));
  container.register('CatalogEntityLookupRepository', () => new CatalogEntityLookupRepository(db));

  container.register(
    'DeploymentService',
    () => new DeploymentService(container.resolve('DeploymentRepository')),
  );
  container.register(
    'DeploymentTrackingService',
    () =>
      new DeploymentTrackingService(
        container.resolve('DeploymentRepository'),
        container.resolve('CatalogEntityLookupRepository'),
      ),
  );

  container.register(
    'DeploymentController',
    () => new DeploymentController(container.resolve('DeploymentService')),
  );
  container.register(
    'WebhookController',
    () => new WebhookController(container.resolve('DeploymentTrackingService')),
  );

  const router = Router();
  router.use('/api/deployments', createDeploymentRouter(container.resolve('DeploymentController')));
  router.use('/api/webhooks', createWebhookRouter(container.resolve('WebhookController')));

  return router;
}
