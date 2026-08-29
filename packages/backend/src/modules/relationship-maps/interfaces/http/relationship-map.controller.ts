import type { Request, Response } from 'express';
import type { z } from 'zod';

import { orgContext } from '../../../../shared/context/org-context.js';
import type { RelationshipMapService } from '../../application/relationship-map.service.js';
import type {
  attachRelationshipSchema,
  createRelationshipMapSchema,
  mapIdParamSchema,
  mapRelationshipParamSchema,
  updateRelationshipMapSchema,
} from './relationship-map.validation.js';

type CreateMapBody = z.infer<typeof createRelationshipMapSchema>;
type UpdateMapBody = z.infer<typeof updateRelationshipMapSchema>;
type AttachBody = z.infer<typeof attachRelationshipSchema>;
type MapIdParam = z.infer<typeof mapIdParamSchema>;
type MapRelationshipParam = z.infer<typeof mapRelationshipParamSchema>;

export class RelationshipMapController {
  public constructor(private readonly service: RelationshipMapService) {}

  public listMaps = async (_request: Request, response: Response): Promise<void> => {
    const orgId = orgContext.getOrThrow();
    const maps = await this.service.listMaps(orgId);
    response.status(200).json({ items: maps });
  };

  public getMap = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as MapIdParam;
    const orgId = orgContext.getOrThrow();

    const detail = await this.service.getMapDetail(params.mapId, orgId);
    response.status(200).json(detail);
  };

  public createMap = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateMapBody;
    const orgId = orgContext.getOrThrow();

    const map = await this.service.createMap(orgId, request.user?.id ?? null, body);
    response.status(201).json(map);
  };

  public updateMap = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as MapIdParam;
    const body = request.body as UpdateMapBody;
    const orgId = orgContext.getOrThrow();

    const map = await this.service.updateMap(params.mapId, orgId, body);
    response.status(200).json(map);
  };

  public deleteMap = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as MapIdParam;
    const orgId = orgContext.getOrThrow();

    await this.service.deleteMap(params.mapId, orgId);
    response.status(204).send();
  };

  public attachRelationship = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as MapIdParam;
    const body = request.body as AttachBody;
    const orgId = orgContext.getOrThrow();

    const detail = await this.service.attachRelationship(params.mapId, orgId, body.relationshipId);
    response.status(201).json(detail);
  };

  public detachRelationship = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as MapRelationshipParam;
    const orgId = orgContext.getOrThrow();

    const detail = await this.service.detachRelationship(params.mapId, orgId, params.relationshipId);
    response.status(200).json(detail);
  };
}
