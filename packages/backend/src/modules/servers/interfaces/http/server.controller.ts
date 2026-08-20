import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { ServerService } from '../../application/server.service.js';

import type {
  createServerBodySchema,
  listServersQuerySchema,
  setServerStatusBodySchema,
  updateServerBodySchema,
} from './server.validation.js';

type CreateServerBody = z.infer<typeof createServerBodySchema>;
type UpdateServerBody = z.infer<typeof updateServerBodySchema>;
type SetServerStatusBody = z.infer<typeof setServerStatusBodySchema>;
type ListServersQuery = z.infer<typeof listServersQuerySchema>;

export class ServerController {
  public constructor(private readonly serverService: ServerService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListServersQuery;

    const result = await this.serverService.list(
      { status: query.status, environment: query.environment, provider: query.provider, search: query.search },
      { page: query.page, pageSize: query.pageSize },
    );

    response.status(200).json({
      items: result.items.map((item) => item.toJSON()),
      pagination: result.pagination,
    });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const server = await this.serverService.getById(request.params.id);
    response.status(200).json(server.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateServerBody;
    const server = await this.serverService.create(body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(server.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateServerBody;
    const server = await this.serverService.update(request.params.id, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(server.toJSON());
  };

  public setStatus = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as SetServerStatusBody;
    const server = await this.serverService.setStatus(request.params.id, body.status, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(server.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.serverService.delete(request.params.id, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };

  public bulkRemove = async (request: Request, response: Response): Promise<void> => {
    const { ids } = request.body as { ids: string[] };
    const count = await this.serverService.bulkDelete(ids, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json({ deleted: count });
  };

  public duplicate = async (request: Request, response: Response): Promise<void> => {
    const { duplicateFromId, ...body } = request.body as CreateServerBody & { duplicateFromId: string };
    const server = await this.serverService.duplicateWithRelationships(duplicateFromId, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(server.toJSON());
  };
}
