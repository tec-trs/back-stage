import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { ServiceService } from './application/service.service.js';
import { ServiceRepository } from './infrastructure/service.repository.js';
import { ServiceController } from './interfaces/http/service.controller.js';
import { createServiceRouter } from './interfaces/http/service.routes.js';

export function registerServiceCatalogModule(): Router {
  container.register('ServiceRepository', () => new ServiceRepository(db));
  container.register(
    'ServiceService',
    () => new ServiceService(container.resolve('ServiceRepository')),
  );
  container.register(
    'ServiceController',
    () => new ServiceController(container.resolve('ServiceService')),
  );

  return createServiceRouter(container.resolve('ServiceController'));
}
