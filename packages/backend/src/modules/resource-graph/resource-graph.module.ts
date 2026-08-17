import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { GraphService } from './application/graph.service.js';
import { ResourceRelationshipRepository } from './infrastructure/resource-relationship.repository.js';
import { GraphController } from './interfaces/http/graph.controller.js';
import { createGraphRouter } from './interfaces/http/graph.routes.js';

export function registerResourceGraphModule(): Router {
  container.register(
    'ResourceRelationshipRepository',
    () => new ResourceRelationshipRepository(db),
  );
  container.register(
    'GraphService',
    () => new GraphService(container.resolve('ResourceRelationshipRepository')),
  );
  container.register(
    'GraphController',
    () => new GraphController(container.resolve('GraphService')),
  );

  return createGraphRouter(container.resolve('GraphController'));
}
