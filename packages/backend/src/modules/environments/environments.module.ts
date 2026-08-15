import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { EnvironmentService } from './application/environment.service.js';
import { EnvironmentRepository } from './infrastructure/environment.repository.js';
import { EnvironmentController } from './interfaces/http/environment.controller.js';
import { createEnvironmentRouter } from './interfaces/http/environment.routes.js';

export function registerEnvironmentsModule(): Router {
  container.register('EnvironmentRepository', () => new EnvironmentRepository(db));
  container.register(
    'EnvironmentService',
    () => new EnvironmentService(container.resolve('EnvironmentRepository')),
  );
  container.register(
    'EnvironmentController',
    () => new EnvironmentController(container.resolve('EnvironmentService')),
  );

  return createEnvironmentRouter(container.resolve('EnvironmentController'));
}
