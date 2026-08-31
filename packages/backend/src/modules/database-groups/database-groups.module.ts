import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { DatabaseGroupService } from './application/database-group.service.js';
import { DatabaseGroupController } from './interfaces/http/database-group.controller.js';
import { createDatabaseGroupRouter } from './interfaces/http/database-group.routes.js';

export function registerDatabaseGroupsModule(): Router {
  container.register('DatabaseGroupService', () => new DatabaseGroupService(db));
  container.register(
    'DatabaseGroupController',
    () => new DatabaseGroupController(container.resolve('DatabaseGroupService')),
  );

  return createDatabaseGroupRouter(container.resolve('DatabaseGroupController'));
}
