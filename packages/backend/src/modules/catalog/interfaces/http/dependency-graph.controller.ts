import type { Request, Response } from 'express';

import type { DependencyGraphService } from '../../application/dependency-graph.service.js';

export class DependencyGraphController {
  public constructor(private readonly dependencyGraphService: DependencyGraphService) {}

  public getGraph = async (_request: Request, response: Response): Promise<void> => {
    const graph = await this.dependencyGraphService.getGraph();
    response.status(200).json(graph);
  };
}
