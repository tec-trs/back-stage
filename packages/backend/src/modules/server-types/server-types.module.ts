import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { ServerTypeService } from './application/server-type.service.js';
import { ServerTypeRepository } from './infrastructure/server-type.repository.js';
import { ServerTypeController } from './interfaces/http/server-type.controller.js';
import { createServerTypeRouter } from './interfaces/http/server-type.routes.js';

export function registerServerTypesModule(): Router {
  container.register('ServerTypeRepository', () => new ServerTypeRepository(db));
  container.register('ServerTypeService', () => new ServerTypeService(container.resolve('ServerTypeRepository')));
  container.register('ServerTypeController', () => new ServerTypeController(container.resolve('ServerTypeService')));

  return createServerTypeRouter(container.resolve('ServerTypeController'));
}
