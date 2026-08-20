import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { CatalogEntityRelationService } from '../../application/catalog-entity-relation.service.js';

import type {
  createRelationSchema,
  deleteRelationParamsSchema,
  getRelationsBySourceParamsSchema,
} from './catalog-entity-relation.validation.js';

type CreateRelationBody = z.infer<typeof createRelationSchema>;
type DeleteRelationParams = z.infer<typeof deleteRelationParamsSchema>;
type GetRelationsBySourceParams = z.infer<typeof getRelationsBySourceParamsSchema>;

export class CatalogEntityRelationController {
  public constructor(private readonly relationService: CatalogEntityRelationService) {}

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateRelationBody;
    const result = await this.relationService.create({
      sourceEntityId: body.sourceEntityId,
      targetEntityId: body.targetEntityId,
      relationType: body.relationType,
      metadata: body.metadata,
    });
    response.status(201).json(result);
  };

  public delete = async (request: Request, response: Response): Promise<void> => {
    const { sourceId, targetId, relationType } = request.params as unknown as DeleteRelationParams;
    await this.relationService.deleteRelation(sourceId, targetId, relationType);
    response.status(204).send();
  };

  public getBySource = async (request: Request, response: Response): Promise<void> => {
    const { sourceId } = request.params as unknown as GetRelationsBySourceParams;
    const relations = await this.relationService.getRelationsBySource(sourceId);
    response.status(200).json(relations);
  };

  public getByTarget = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as Record<string, string>;
    const relations = await this.relationService.getRelationsByTarget(params.targetId);
    response.status(200).json(relations);
  };
}
