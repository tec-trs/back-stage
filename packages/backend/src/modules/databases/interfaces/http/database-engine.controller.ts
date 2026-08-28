import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { DatabaseEngineService } from '../../application/database-engine.service.js';

import type {
  createDatabaseEngineBodySchema,
  updateDatabaseEngineBodySchema,
} from './database-engine.validation.js';

type CreateDatabaseEngineBody = z.infer<typeof createDatabaseEngineBodySchema>;
type UpdateDatabaseEngineBody = z.infer<typeof updateDatabaseEngineBodySchema>;

export class DatabaseEngineController {
  public constructor(private readonly databaseEngineService: DatabaseEngineService) {}

  public list = async (_request: Request, response: Response): Promise<void> => {
    const engines = await this.databaseEngineService.findAll();
    response.status(200).json({ items: engines.map((item) => item.toJSON()) });
  };

  public listActive = async (_request: Request, response: Response): Promise<void> => {
    const engines = await this.databaseEngineService.findActive();
    response.status(200).json({ items: engines.map((item) => item.toJSON()) });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const engine = await this.databaseEngineService.getById(request.params.id);
    response.status(200).json(engine.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateDatabaseEngineBody;
    const engine = await this.databaseEngineService.create(body);
    response.status(201).json(engine.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateDatabaseEngineBody;
    const engine = await this.databaseEngineService.update(request.params.id, body);
    response.status(200).json(engine.toJSON());
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    await this.databaseEngineService.delete(request.params.id);
    response.status(204).send();
  };
}
