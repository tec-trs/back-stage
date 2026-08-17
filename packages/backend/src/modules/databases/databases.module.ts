import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { DatabaseService } from './application/database.service.js';
import { DatabaseRepository } from './infrastructure/database.repository.js';
import { DatabaseController } from './interfaces/http/database.controller.js';
import { createDatabaseRouter } from './interfaces/http/database.routes.js';

export function registerDatabasesModule(): Router {
  container.register('DatabaseRepository', () => new DatabaseRepository(db));
  container.register(
    'DatabaseService',
    () => new DatabaseService(container.resolve('DatabaseRepository')),
  );
  container.register(
    'DatabaseController',
    () => new DatabaseController(container.resolve('DatabaseService')),
  );

  return createDatabaseRouter(container.resolve('DatabaseController'));
}
