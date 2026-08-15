import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { ApplicationTypeService } from './application/application-type.service.js';
import { ApplicationTypeRepository } from './infrastructure/application-type.repository.js';
import { ApplicationTypeController } from './interfaces/http/application-type.controller.js';
import { createApplicationTypeRouter } from './interfaces/http/application-type.routes.js';

export function registerApplicationTypesModule(): Router {
  container.register('ApplicationTypeRepository', () => new ApplicationTypeRepository(db));
  container.register('ApplicationTypeService', () => new ApplicationTypeService(container.resolve('ApplicationTypeRepository')));
  container.register('ApplicationTypeController', () => new ApplicationTypeController(container.resolve('ApplicationTypeService')));

  return createApplicationTypeRouter(container.resolve('ApplicationTypeController'));
}
