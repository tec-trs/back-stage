import { Router } from 'express';

import { container } from '../../shared/container.js';

import { GetHealthStatusService } from './application/get-health-status.service.js';
import { ProcessHealthRepository } from './infrastructure/process-health.repository.js';
import { HealthController } from './interfaces/http/health.controller.js';
import { createHealthRouter } from './interfaces/http/health.routes.js';

const APP_VERSION = '0.1.0';

export function registerHealthModule(): Router {
  container.register('HealthRepository', () => new ProcessHealthRepository(APP_VERSION));
  container.register(
    'GetHealthStatusService',
    () => new GetHealthStatusService(container.resolve('HealthRepository')),
  );
  container.register(
    'HealthController',
    () => new HealthController(container.resolve('GetHealthStatusService')),
  );

  return createHealthRouter(container.resolve('HealthController'));
}
