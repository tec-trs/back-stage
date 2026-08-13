import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { EcosystemGraphService } from './application/ecosystem-graph.service.js';
import { EcosystemGraphRepository } from './infrastructure/ecosystem-graph.repository.js';
import { EcosystemGraphController } from './interfaces/http/ecosystem-graph.controller.js';
import { createEcosystemGraphRouter } from './interfaces/http/ecosystem-graph.routes.js';

export function registerEcosystemModule(): Router {
  container.register('EcosystemGraphRepository', () => new EcosystemGraphRepository(db));
  container.register(
    'EcosystemGraphService',
    () => new EcosystemGraphService(container.resolve('EcosystemGraphRepository')),
  );
  container.register(
    'EcosystemGraphController',
    () => new EcosystemGraphController(container.resolve('EcosystemGraphService')),
  );

  return createEcosystemGraphRouter(container.resolve('EcosystemGraphController'));
}
