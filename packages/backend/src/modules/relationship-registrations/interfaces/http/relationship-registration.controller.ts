import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { RelationshipRegistrationService } from '../../application/relationship-registration.service.js';

import type {
  addRelationshipBodySchema,
  createRelationshipRegistrationBodySchema,
  updateRelationshipRegistrationBodySchema,
} from './relationship-registration.validation.js';

type CreateBody = z.infer<typeof createRelationshipRegistrationBodySchema>;
type UpdateBody = z.infer<typeof updateRelationshipRegistrationBodySchema>;
type AddRelationshipBody = z.infer<typeof addRelationshipBodySchema>;

export class RelationshipRegistrationController {
  public constructor(private readonly service: RelationshipRegistrationService) {}

  public list = async (_request: Request, response: Response): Promise<void> => {
    const registrations = await this.service.list();
    response.status(200).json(registrations.map((r) => r.toJSON()));
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateBody;
    const registration = await this.service.create(body);
    response.status(201).json(registration.toJSON());
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const { registration, relationships } = await this.service.getByIdWithRelationships(request.params.id);
    response.status(200).json({
      ...registration.toJSON(),
      relationships: relationships.map((r) => r.toJSON()),
    });
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateBody;
    const registration = await this.service.update(request.params.id, body);
    response.status(200).json(registration.toJSON());
  };

  public remove = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(request.params.id);
    response.status(204).send();
  };

  public addRelationship = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as AddRelationshipBody;
    const relationship = await this.service.addRelationship(request.params.registrationId, {
      ...body,
      sourceLabel: body.sourceLabel ?? body.sourceId,
      targetLabel: body.targetLabel ?? body.targetId,
    });
    response.status(201).json(relationship.toJSON());
  };

  public removeRelationship = async (request: Request, response: Response): Promise<void> => {
    await this.service.removeRelationship(request.params.registrationId, request.params.relationshipId);
    response.status(204).send();
  };
}
