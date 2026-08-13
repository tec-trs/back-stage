import type { Request, Response } from 'express';
import type { z } from 'zod';

import type { DeploymentService } from '../../application/deployment.service.js';

import type {
  createDeploymentBodySchema,
  listDeploymentsQuerySchema,
} from './deployment.validation.js';

type CreateDeploymentBody = z.infer<typeof createDeploymentBodySchema>;
type ListDeploymentsQuery = z.infer<typeof listDeploymentsQuerySchema>;

export class DeploymentController {
  public constructor(private readonly deploymentService: DeploymentService) {}

  public list = async (request: Request, response: Response): Promise<void> => {
    const query = request.query as unknown as ListDeploymentsQuery;
    const result = await this.deploymentService.list(
      { entityId: query.entityId, environment: query.environment, status: query.status },
      { page: query.page, pageSize: query.pageSize },
    );
    response.status(200).json(result);
  };

  public getById = async (request: Request, response: Response): Promise<void> => {
    const deployment = await this.deploymentService.getById(request.params.id);
    response.status(200).json(deployment);
  };

  public create = async (request: Request, response: Response): Promise<void> => {
    const body = request.body as CreateDeploymentBody;
    const deployment = await this.deploymentService.create(
      {
        entityId: body.entityId,
        environment: body.environment,
        version: body.version,
        status: body.status,
        triggeredByUserId: request.user?.id ?? null,
        startedAt: new Date(),
        metadata: body.metadata,
      },
      {
        actorUserId: request.user?.id,
        ipAddress: request.ip,
        userAgent: request.header('user-agent'),
      },
    );
    response.status(201).json(deployment);
  };
}
