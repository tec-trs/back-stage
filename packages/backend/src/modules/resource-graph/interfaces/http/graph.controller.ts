import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { GraphService } from '../../application/graph.service.js';

import type {
  createRelationshipBodySchema,
  deleteRelationshipParamsSchema,
  getFullGraphQuerySchema,
  getSubgraphParamsSchema,
  getSubgraphQuerySchema,
  simulateImpactBodySchema,
} from './graph.validation.js';

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

    const result = await this.graphService.getSubgraph(params.type, params.id, query.depth);

    response.status(200).json({
      nodes: result.nodes,
      edges: result.edges,
    });
  };

  public simulateImpact = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as SimulateImpactBody;

    const result = await this.graphService.simulateImpact(body.resourceType, body.resourceId);

    response.status(200).json({
      impactedResources: result.impactedResources,
      hasCycle: result.hasCycle,
      totalImpacted: result.totalImpacted,
      byType: result.byType,
      byDepth: result.byDepth,
    });
  };

  public createRelationship = async (request: Request, response: Response): Promise<void> => {
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
    );

    response.status(201).json(result);
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
