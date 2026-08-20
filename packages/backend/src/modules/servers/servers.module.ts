import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { ServerService } from './application/server.service.js';
import { ServerRepository } from './infrastructure/server.repository.js';
import { ServerController } from './interfaces/http/server.controller.js';
import { createServerRouter } from './interfaces/http/server.routes.js';
import { ResourceRelationshipRepository } from '../resource-graph/infrastructure/resource-relationship.repository.js';

export function registerServersModule(): Router {
  container.register('ServerRepository', () => new ServerRepository(db));
  container.register(
    'ServerService',
    () => new ServerService(
      container.resolve('ServerRepository'),
      new ResourceRelationshipRepository(db),
    ),
  );
  container.register(
    'ServerController',
    () => new ServerController(container.resolve('ServerService')),
  );

  return createServerRouter(container.resolve('ServerController'));
}
