import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { LoginService } from './application/login.service.js';
import { UserAuthRepository } from './infrastructure/user-auth.repository.js';
import { AuthController } from './interfaces/http/auth.controller.js';
import { createAuthRouter } from './interfaces/http/auth.routes.js';

export function registerAuthModule(): Router {
  container.register('UserAuthRepository', () => new UserAuthRepository(db));
  container.register(
    'LoginService',
    () => new LoginService(container.resolve('UserAuthRepository')),
  );
  container.register('AuthController', () => new AuthController(container.resolve('LoginService')));

  return createAuthRouter(container.resolve('AuthController'));
}
