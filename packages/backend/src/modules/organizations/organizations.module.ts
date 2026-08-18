import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { OrganizationService } from './application/organization.service.js';
import { OrganizationRepository } from './infrastructure/organization.repository.js';
import { OrganizationController } from './interfaces/http/organization.controller.js';
import { createOrganizationRouter } from './interfaces/http/organization.routes.js';

export function registerOrganizationsModule(): Router {
  container.register('OrganizationRepository', () => new OrganizationRepository(db));
  container.register(
    'OrganizationService',
    () => new OrganizationService(container.resolve('OrganizationRepository')),
  );
  container.register(
    'OrganizationController',
    () => new OrganizationController(container.resolve('OrganizationService')),
  );

  return createOrganizationRouter(container.resolve('OrganizationController'));
}
