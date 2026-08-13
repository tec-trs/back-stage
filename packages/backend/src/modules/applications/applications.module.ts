import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { ApplicationService } from './application/application.service.js';
import { ApplicationRepository } from './infrastructure/application.repository.js';
import { ApplicationController } from './interfaces/http/application.controller.js';
import { createApplicationRouter } from './interfaces/http/application.routes.js';

export function registerApplicationsModule(): Router {
  container.register('ApplicationRepository', () => new ApplicationRepository(db));
  container.register(
    'ApplicationService',
    () => new ApplicationService(container.resolve('ApplicationRepository')),
  );
  container.register(
    'ApplicationController',
    () => new ApplicationController(container.resolve('ApplicationService')),
  );

  return createApplicationRouter(container.resolve('ApplicationController'));
}
