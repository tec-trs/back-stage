import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { PolicyEvaluationService } from './application/policy-evaluation.service.js';
import { PolicyExemptionService } from './application/policy-exemption.service.js';
import { PolicyService } from './application/policy.service.js';
import { PolicyEvaluationRepository } from './infrastructure/policy-evaluation.repository.js';
import { PolicyExemptionRepository } from './infrastructure/policy-exemption.repository.js';
import { PolicyRepository } from './infrastructure/policy.repository.js';
import { PolicyController } from './interfaces/http/policy.controller.js';
import { createPolicyRouter } from './interfaces/http/policy.routes.js';

export function registerGovernanceModule(): Router {
  container.register('PolicyRepository', () => new PolicyRepository(db));
  container.register('PolicyEvaluationRepository', () => new PolicyEvaluationRepository(db));
  container.register('PolicyExemptionRepository', () => new PolicyExemptionRepository(db));

  container.register(
    'PolicyService',
    () => new PolicyService(container.resolve('PolicyRepository')),
  );
  container.register(
    'PolicyEvaluationService',
    () =>
      new PolicyEvaluationService(
        container.resolve('PolicyRepository'),
        container.resolve('PolicyEvaluationRepository'),
      ),
  );
  container.register(
    'PolicyExemptionService',
    () => new PolicyExemptionService(container.resolve('PolicyExemptionRepository')),
  );

  container.register(
    'PolicyController',
    () =>
      new PolicyController(
        container.resolve('PolicyService'),
        container.resolve('PolicyEvaluationService'),
        container.resolve('PolicyExemptionService'),
      ),
  );

  return createPolicyRouter(container.resolve('PolicyController'));
}
