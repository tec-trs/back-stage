import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { RelationshipRegistrationService } from './application/relationship-registration.service.js';
import { RelationshipRegistrationRepository } from './infrastructure/relationship-registration.repository.js';
import { RelationshipRegistrationController } from './interfaces/http/relationship-registration.controller.js';
import { createRelationshipRegistrationRouter } from './interfaces/http/relationship-registration.routes.js';

export function registerRelationshipRegistrationsModule(): Router {
  container.register(
    'RelationshipRegistrationRepository',
    () => new RelationshipRegistrationRepository(db),
  );
  container.register(
    'RelationshipRegistrationService',
    () => new RelationshipRegistrationService(container.resolve('RelationshipRegistrationRepository')),
  );
  container.register(
    'RelationshipRegistrationController',
    () => new RelationshipRegistrationController(container.resolve('RelationshipRegistrationService')),
  );

  return createRelationshipRegistrationRouter(container.resolve('RelationshipRegistrationController'));
}
