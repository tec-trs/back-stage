import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { ApplicationTypeService } from '../../application/application-type.service.js';
import type { createApplicationTypeBodySchema, updateApplicationTypeBodySchema } from './application-type.validation.js';

type CreateBody = z.infer<typeof createApplicationTypeBodySchema>;
type UpdateBody = z.infer<typeof updateApplicationTypeBodySchema>;

export class ApplicationTypeController {
  public constructor(private readonly service: ApplicationTypeService) {}

  public list = async (_request: Request, response: Response): Promise<void> => {
    const items = await this.service.list();
    response.status(200).json({ items: items.map((i) => i.toJSON()) });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const item = await this.service.getById(request.params.id);
    response.status(200).json(item.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateBody;
    const item = await this.service.create(body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(item.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateBody;
    const item = await this.service.update(request.params.id, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(item.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(request.params.id, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };
}
