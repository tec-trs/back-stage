import { Router } from 'express';

import { db } from '../../database/connection.js';
import { container } from '../../shared/container.js';

import { TeamService } from './application/team.service.js';
import { TeamRepository } from './infrastructure/team.repository.js';
import { TeamController } from './interfaces/http/team.controller.js';
import { createTeamRouter } from './interfaces/http/team.routes.js';

export function registerTeamsModule(): Router {
  container.register('TeamRepository', () => new TeamRepository(db));
  container.register('TeamService', () => new TeamService(container.resolve('TeamRepository')));
  container.register(
    'TeamController',
    () => new TeamController(container.resolve('TeamService')),
  );
  return createTeamRouter(container.resolve('TeamController'));
}
