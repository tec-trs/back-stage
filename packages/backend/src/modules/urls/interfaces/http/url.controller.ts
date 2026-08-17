import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { UrlService } from '../../application/url.service.js';

import type {
  createUrlBodySchema,
  listUrlsQuerySchema,
  setUrlStatusBodySchema,
  updateUrlBodySchema,
} from './url.validation.js';

type CreateUrlBody = z.infer<typeof createUrlBodySchema>;
type UpdateUrlBody = z.infer<typeof updateUrlBodySchema>;
type SetUrlStatusBody = z.infer<typeof setUrlStatusBodySchema>;
type ListUrlsQuery = z.infer<typeof listUrlsQuerySchema>;

export class UrlController {
  public constructor(private readonly urlService: UrlService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListUrlsQuery;

    const result = await this.urlService.list(
      {
        status: query.status,
        urlType: query.urlType,
        ownerResourceType: query.ownerResourceType,
        ownerResourceId: query.ownerResourceId,
        tags: query.tags,
        search: query.search,
      },
      { page: query.page, pageSize: query.pageSize },
    );

    response.status(200).json({
      items: result.items.map((item) => item.toJSON()),
      pagination: result.pagination,
    });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const url = await this.urlService.getById(request.params.id);
    response.status(200).json(url.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateUrlBody;
    const url = await this.urlService.create(body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(url.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateUrlBody;
    const url = await this.urlService.update(request.params.id, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(url.toJSON());
  };

  public setStatus = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as SetUrlStatusBody;
    const url = await this.urlService.setStatus(request.params.id, body.status, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(url.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.urlService.delete(request.params.id, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };
}
