import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { DatabaseService } from '../../application/database.service.js';

import type {
  bulkDeleteDatabasesBodySchema,
  createDatabaseBodySchema,
  createDatabasePortBodySchema,
  listDatabasesQuerySchema,
  setDatabaseStatusBodySchema,
  updateDatabaseBodySchema,
  updateDatabasePortBodySchema,
} from './database.validation.js';

type CreateDatabaseBody = z.infer<typeof createDatabaseBodySchema>;
type UpdateDatabaseBody = z.infer<typeof updateDatabaseBodySchema>;
type SetDatabaseStatusBody = z.infer<typeof setDatabaseStatusBodySchema>;
type ListDatabasesQuery = z.infer<typeof listDatabasesQuerySchema>;
type BulkDeleteDatabasesBody = z.infer<typeof bulkDeleteDatabasesBodySchema>;

export class DatabaseController {
  public constructor(private readonly databaseService: DatabaseService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListDatabasesQuery;

    const result = await this.databaseService.list(
      { status: query.status, criticality: query.criticality, engine: query.engine, environment: query.environment, tags: query.tags, search: query.search },
      { page: query.page, pageSize: query.pageSize },
    );

    response.status(200).json({
      items: result.items.map((item) => item.toJSON()),
      pagination: result.pagination,
    });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const database = await this.databaseService.getById(request.params.id);
    response.status(200).json(database.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateDatabaseBody;
    const database = await this.databaseService.create(body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(database.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateDatabaseBody;
    const database = await this.databaseService.update(request.params.id, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(database.toJSON());
  };

  public setStatus = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as SetDatabaseStatusBody;
    const database = await this.databaseService.setStatus(request.params.id, body.status, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(database.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.databaseService.delete(request.params.id, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };

  public bulkDelete = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as BulkDeleteDatabasesBody;
    const count = await this.databaseService.bulkDelete(body.ids, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json({ deleted: count });

  public getPortsByDatabaseId = async (request: Request, response: Response): Promise<void> => {
    const ports = await this.databaseService.getPortsByDatabaseId(request.params.id);
    response.status(200).json(ports.map((port) => port.toJSON()));
  };

  public addDatabasePort = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as z.infer<typeof createDatabasePortBodySchema>;
    const port = await this.databaseService.addDatabasePort(request.params.id, body.port, body.parameters ?? null, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(port.toJSON());
  };

  public updateDatabasePort = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as z.infer<typeof updateDatabasePortBodySchema>;
    const port = await this.databaseService.updateDatabasePort(request.params.id, request.params.portId, body.parameters ?? null, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(port.toJSON());
  };

  public removeDatabasePort = async (request: Request, response: Response): Promise<void> => {
    await this.databaseService.removeDatabasePort(request.params.id, request.params.portId, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };
}
