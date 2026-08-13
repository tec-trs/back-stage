import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { UserService } from './application/user.service.js';
import { UserRepository } from './infrastructure/user.repository.js';
import { UserController } from './interfaces/http/user.controller.js';
import { createUserRouter } from './interfaces/http/user.routes.js';

export function registerUsersModule(): Router {
  container.register('UserRepository', () => new UserRepository(db));
  container.register('UserService', () => new UserService(container.resolve('UserRepository')));
  container.register(
    'UserController',
    () => new UserController(container.resolve('UserService')),
  );

  return createUserRouter(container.resolve('UserController'));
}
