import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { EnvironmentService } from '../../application/environment.service.js';

import type {
  createEnvironmentBodySchema,
  updateEnvironmentBodySchema,
} from './environment.validation.js';

type CreateEnvironmentBody = z.infer<typeof createEnvironmentBodySchema>;
type UpdateEnvironmentBody = z.infer<typeof updateEnvironmentBodySchema>;

export class EnvironmentController {
  public constructor(private readonly environmentService: EnvironmentService) {}

  public list = async (_request: Request, response: Response): Promise<void> => {
    const items = await this.environmentService.list();
    response.status(200).json({ items: items.map((e) => e.toJSON()) });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const env = await this.environmentService.getById(request.params.id);
    response.status(200).json(env.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateEnvironmentBody;
    const env = await this.environmentService.create(body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(201).json(env.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateEnvironmentBody;
    const env = await this.environmentService.update(request.params.id, body, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json(env.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.environmentService.delete(request.params.id, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(204).send();
  };

  public bulkRemove = async (request: Request, response: Response): Promise<void> => {
    const { ids } = request.body as { ids: string[] };
    const count = await this.environmentService.bulkDelete(ids, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
    response.status(200).json({ deleted: count });
  };
}
