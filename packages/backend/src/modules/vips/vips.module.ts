import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { VIPService } from './application/vip.service.js';
import { VIPController } from './interfaces/http/vip.controller.js';
import { createVIPRouter } from './interfaces/http/vip.routes.js';

export function registerVIPsModule(): Router {
  container.register('VIPService', () => new VIPService(db));
  container.register(
    'VIPController',
    () => new VIPController(container.resolve('VIPService')),
  );

  return createVIPRouter(container.resolve('VIPController'));
}
