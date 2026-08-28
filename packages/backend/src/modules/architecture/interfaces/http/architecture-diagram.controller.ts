import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { ArchitectureDiagramService } from '../../application/architecture-diagram.service.js';
import type {
  createArchitectureDiagramBodySchema,
  updateArchitectureDiagramBodySchema,
} from './architecture-diagram.validation.js';

type CreateArchitectureDiagramBody = z.infer<typeof createArchitectureDiagramBodySchema>;
type UpdateArchitectureDiagramBody = z.infer<typeof updateArchitectureDiagramBodySchema>;

export class ArchitectureDiagramController {
  public constructor(private readonly service: ArchitectureDiagramService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const diagrams = await this.service.findAll(request.user?.organizationId || '');
    response.status(200).json(diagrams);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const diagram = await this.service.getById(request.params.id);
    response.status(200).json(diagram);
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateArchitectureDiagramBody;
    const diagram = await this.service.create(
      {
        name: body.name,
        description: body.description,
        nodes: body.nodes as any,
        edges: body.edges as any,
        organizationId: request.user?.organizationId || '',
      },
      request.user?.id || ''
    );
    response.status(201).json(diagram);
  };

  public update = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as UpdateArchitectureDiagramBody;
    const diagram = await this.service.update(request.params.id, {
      name: body.name,
      description: body.description,
      nodes: body.nodes as any,
      edges: body.edges as any,
    });
    response.status(200).json(diagram);
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(request.params.id);
    response.status(204).send();
  };
}
