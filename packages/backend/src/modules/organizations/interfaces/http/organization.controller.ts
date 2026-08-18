import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { OrganizationService } from '../../application/organization.service.js';
import type { createOrgBodySchema, updateOrgBodySchema } from './organization.validation.js';

type CreateBody = z.infer<typeof createOrgBodySchema>;
type UpdateBody = z.infer<typeof updateOrgBodySchema>;

export class OrganizationController {
  public constructor(private readonly service: OrganizationService) {}

  public list = async (_request: Request, response: Response): Promise<void> => {
    const items = await this.service.list();
    response.status(200).json({ items: items.map((o) => o.toJSON()) });
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const org = await this.service.getById(request.params.id);
    response.status(200).json(org.toJSON());
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateBody;
    const org = await this.service.create(body);
    response.status(201).json(org.toJSON());
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateBody;
    const org = await this.service.update(request.params.id, body);
    response.status(200).json(org.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(request.params.id);
    response.status(204).send();
  };
}
