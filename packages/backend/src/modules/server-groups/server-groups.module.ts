import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { ServerGroupService } from './application/server-group.service.js';
import { ServerGroupController } from './interfaces/http/server-group.controller.js';
import { createServerGroupRouter } from './interfaces/http/server-group.routes.js';

export function registerServerGroupsModule(): Router {
  container.register('ServerGroupService', () => new ServerGroupService(db));
  container.register(
    'ServerGroupController',
    () => new ServerGroupController(container.resolve('ServerGroupService')),
  );

  return createServerGroupRouter(container.resolve('ServerGroupController'));
}
