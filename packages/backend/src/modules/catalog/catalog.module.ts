import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { CatalogEntityRelationService } from './application/catalog-entity-relation.service.js';
import { CatalogEntityService } from './application/catalog-entity.service.js';
import { DependencyGraphService } from './application/dependency-graph.service.js';
import { CatalogEntityRelationRepository } from './infrastructure/catalog-entity-relation.repository.js';
import { CatalogEntityRepository } from './infrastructure/catalog-entity.repository.js';
import { DependencyGraphRepository } from './infrastructure/dependency-graph.repository.js';
import { CatalogEntityRelationController } from './interfaces/http/catalog-entity-relation.controller.js';
import { createCatalogEntityRelationRouter } from './interfaces/http/catalog-entity-relation.routes.js';
import { CatalogEntityController } from './interfaces/http/catalog-entity.controller.js';
import { createCatalogEntityRouter } from './interfaces/http/catalog-entity.routes.js';
import { DependencyGraphController } from './interfaces/http/dependency-graph.controller.js';
import { createDependencyGraphRouter } from './interfaces/http/dependency-graph.routes.js';

export function registerCatalogModule(): Router {
  container.register('CatalogEntityRepository', () => new CatalogEntityRepository(db));
  container.register(
    'CatalogEntityService',
    () => new CatalogEntityService(container.resolve('CatalogEntityRepository')),
  );
  container.register(
    'CatalogEntityController',
    () => new CatalogEntityController(container.resolve('CatalogEntityService')),
  );

  container.register('CatalogEntityRelationRepository', () => new CatalogEntityRelationRepository(db));
  container.register(
    'CatalogEntityRelationService',
    () => new CatalogEntityRelationService(container.resolve('CatalogEntityRelationRepository')),
  );
  container.register(
    'CatalogEntityRelationController',
    () => new CatalogEntityRelationController(container.resolve('CatalogEntityRelationService')),
  );

  container.register('DependencyGraphRepository', () => new DependencyGraphRepository(db));
  container.register(
    'DependencyGraphService',
    () => new DependencyGraphService(container.resolve('DependencyGraphRepository')),
  );
  container.register(
    'DependencyGraphController',
    () => new DependencyGraphController(container.resolve('DependencyGraphService')),
  );

  const router = Router();
  router.use(createDependencyGraphRouter(container.resolve('DependencyGraphController')));
  router.use(createCatalogEntityRouter(container.resolve('CatalogEntityController')));
  router.use(createCatalogEntityRelationRouter(container.resolve('CatalogEntityRelationController')));

  return router;
}
