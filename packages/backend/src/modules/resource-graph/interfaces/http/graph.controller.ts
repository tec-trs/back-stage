import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { GraphService } from '../../application/graph.service.js';

import type {
  createRelationshipBodySchema,
  deleteRelationshipParamsSchema,
  getFullGraphQuerySchema,
  getSubgraphParamsSchema,
  getSubgraphQuerySchema,
  listRelationshipsQuerySchema,
  simulateImpactBodySchema,
} from './graph.validation.js';

type ListRelationshipsQuery = z.infer<typeof listRelationshipsQuerySchema>;
type GetFullGraphQuery = z.infer<typeof getFullGraphQuerySchema>;
type GetSubgraphParams = z.infer<typeof getSubgraphParamsSchema>;
type GetSubgraphQuery = z.infer<typeof getSubgraphQuerySchema>;
type SimulateImpactBody = z.infer<typeof simulateImpactBodySchema>;
type CreateRelationshipBody = z.infer<typeof createRelationshipBodySchema>;
type DeleteRelationshipParams = z.infer<typeof deleteRelationshipParamsSchema>;

export class GraphController {
  public constructor(private readonly graphService: GraphService) {}

  public getFullGraph = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as GetFullGraphQuery;

    const result = await this.graphService.getFullGraph(
      {
        resourceTypes: query.resourceTypes as any,
        environment: query.environment,
        criticality: query.criticality,
        status: query.status,
      },
      { page: query.page, pageSize: query.pageSize },
    );

    response.status(200).json({
      nodes: result.nodes,
      edges: result.edges,
      pagination: result.pagination,
    });
  };

  public getSubgraph = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as GetSubgraphParams;
    const query = request.query as unknown as GetSubgraphQuery;

    const result = await this.graphService.getSubgraph(params.type, params.id, {
      depth: query.depth,
      direction: query.direction,
      relationType: query.relationType,
    });

    response.status(200).json({
      nodes: result.nodes,
      edges: result.edges,
    });
  };

  public listRelationships = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListRelationshipsQuery;
    const edges = await this.graphService.listRelationships({
      sourceType: query.sourceType,
      sourceId:   query.sourceId,
      targetType: query.targetType,
      targetId:   query.targetId,
      relationType: query.relationType,
    });
    response.status(200).json({ items: edges });
  };

  public simulateImpact = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as SimulateImpactBody;

    const result = await this.graphService.simulateImpact(
      body.resourceType,
      body.resourceId,
      body.maxDepth,
    );

    response.status(200).json({
      impactedResources: result.impactedResources,
      hasCycle: result.hasCycle,
      totalImpacted: result.totalImpacted,
      byType: result.byType,
      byDepth: result.byDepth,
    });
  };

  public createRelationship = async (request: Request, response: Response): Promise<void> => {
    try {
      const body = request.body as CreateRelationshipBody;

      const result = await this.graphService.createRelationship(
        body.sourceType,
        body.sourceId,
        body.targetType,
        body.targetId,
        body.relationType,
        body.metadata,
        {
          actorUserId: request.user?.id,
          ipAddress: request.ip,
          userAgent: request.header('user-agent'),
        },
        body.reason,
      );

      response.status(201).json(result);
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes('duplicate key') || error.message.includes('violates unique constraint'))
      ) {
        response.status(409).json({
          error: 'Conflito',
          message: 'Este relacionamento já existe',
        });
      } else {
        throw error;
      }
    }
  };

  public getCriticalResources = async (_request: Request, response: Response): Promise<void> => {
    const result = await this.graphService.getCriticalResources();
    response.status(200).json(result);
  };

  public deleteRelationship = async (request: Request, response: Response): Promise<void> => {
    const params = request.params as unknown as DeleteRelationshipParams;

    await this.graphService.deleteRelationship(params.relationshipId, {
      actorUserId: request.user?.id,
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });

    response.status(204).send();
  };
}
