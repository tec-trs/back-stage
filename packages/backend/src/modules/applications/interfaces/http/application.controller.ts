import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { ApplicationService } from '../../application/application.service.js';

import type {
  createApplicationBodySchema,
  listApplicationsQuerySchema,
  setApplicationStatusBodySchema,
  updateApplicationBodySchema,
} from './application.validation.js';

type CreateApplicationBody = z.infer<typeof createApplicationBodySchema>;
type UpdateApplicationBody = z.infer<typeof updateApplicationBodySchema>;
type SetApplicationStatusBody = z.infer<typeof setApplicationStatusBodySchema>;
type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;

export class ApplicationController {
  public constructor(private readonly applicationService: ApplicationService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListApplicationsQuery;

    const result = await this.applicationService.list(
      { status: query.status, criticality: query.criticality, appType: query.appType, search: query.search },
      { page: query.page, pageSize: query.pageSize },
    );

    response.status(200).json({
      items: result.items.map((item) => item.toJSON()),
      pagination: result.pagination,
    });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const application = await this.applicationService.getById(request.params.id);
    response.status(200).json(application.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateApplicationBody;
    const application = await this.applicationService.create(body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(application.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateApplicationBody;
    const application = await this.applicationService.update(request.params.id, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(application.toJSON());
  };

  public setStatus = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as SetApplicationStatusBody;
    const application = await this.applicationService.setStatus(request.params.id, body.status, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(application.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.applicationService.delete(request.params.id, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };
}
