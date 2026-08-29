import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { RelationshipMapService } from './application/relationship-map.service.js';
import { RelationshipMapController } from './interfaces/http/relationship-map.controller.js';
import { createRelationshipMapRouter } from './interfaces/http/relationship-map.routes.js';

export function registerRelationshipMapsModule(): Router {
  container.register('RelationshipMapService', () => new RelationshipMapService(db));
  container.register(
    'RelationshipMapController',
    () => new RelationshipMapController(container.resolve('RelationshipMapService')),
  );

  return createRelationshipMapRouter(container.resolve('RelationshipMapController'));
}
