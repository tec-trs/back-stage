import type { Knex } from 'knex';
import { ArchitectureDiagramRepository } from './infrastructure/architecture-diagram.repository.js';
import { ArchitectureDiagramService } from './application/architecture-diagram.service.js';
import { ArchitectureDiagramController } from './interfaces/http/architecture-diagram.controller.js';
import { createArchitectureDiagramRouter } from './interfaces/http/architecture-diagram.routes.js';

export function registerArchitectureModule(db: Knex) {
  const repository = new ArchitectureDiagramRepository(db);
  const service = new ArchitectureDiagramService(repository);
  const controller = new ArchitectureDiagramController(service);
  const router = createArchitectureDiagramRouter(controller);

  return { repository, service, controller, router };
}

export { ArchitectureDiagramService };
export type { ArchitectureDiagram } from './domain/architecture-diagram.entity.js';
