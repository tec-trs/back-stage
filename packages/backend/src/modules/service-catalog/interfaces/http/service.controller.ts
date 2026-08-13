import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { ServiceService } from '../../application/service.service.js';

import type {
  createServiceBodySchema,
  listServicesQuerySchema,
  searchServicesQuerySchema,
  updateServiceBodySchema,
} from './service.validation.js';

type CreateServiceBody = z.infer<typeof createServiceBodySchema>;
type UpdateServiceBody = z.infer<typeof updateServiceBodySchema>;
type ListServicesQuery = z.infer<typeof listServicesQuerySchema>;
type SearchServicesQuery = z.infer<typeof searchServicesQuerySchema>;

export class ServiceController {
  public constructor(private readonly serviceService: ServiceService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListServicesQuery;

    const result = await this.serviceService.list(
      {
        lifecycle: query.lifecycle,
        ownerTeamId: query.ownerTeamId,
        systemId: query.systemId,
        namespace: query.namespace,
        type: query.type,
      },
      { sortBy: query.sortBy, sortOrder: query.sortOrder },
      { page: query.page, pageSize: query.pageSize },
    );

    response.status(200).json({
      items: result.items.map((item) => item.toJSON()),
      pagination: result.pagination,
    });
  };

  public search = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as SearchServicesQuery;
    const results = await this.serviceService.search(query.q, query.limit);
    response.status(200).json({ items: results.map((item) => item.toJSON()) });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const service = await this.serviceService.getById(request.params.id);
    response.status(200).json(service.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateServiceBody;
    const service = await this.serviceService.create(body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(service.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateServiceBody;
    const service = await this.serviceService.update(request.params.id, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(service.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.serviceService.delete(request.params.id, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };
}
