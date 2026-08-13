import type { Request, Response } from 'express';

import type { EcosystemGraphService } from '../../application/ecosystem-graph.service.js';

export class EcosystemGraphController {
  public constructor(private readonly ecosystemGraphService: EcosystemGraphService) {}

  public getGraph = async (_request: Request, response: Response): Promise<void> => {
    const graph = await this.ecosystemGraphService.getGraph();
    response.status(200).json(graph);
  };
}
