import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { SearchService } from './application/search.service.js';
import { SearchRepository } from './infrastructure/search.repository.js';
import { SearchController } from './interfaces/http/search.controller.js';
import { createSearchRouter } from './interfaces/http/search.routes.js';

export function registerSearchModule(): Router {
  container.register('SearchRepository', () => new SearchRepository(db));
  container.register(
    'SearchService',
    () => new SearchService(container.resolve('SearchRepository')),
  );
  container.register(
    'SearchController',
    () => new SearchController(container.resolve('SearchService')),
  );

  return createSearchRouter(container.resolve('SearchController'));
}
