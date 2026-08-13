import type { Request, Response } from 'express';

import type { GetHealthStatusService } from '../../application/get-health-status.service.js';

export class HealthController {
  public constructor(private readonly getHealthStatusService: GetHealthStatusService) {}

  public getHealth = async (_request: Request, response: Response): Promise<void> => {
    const status = await this.getHealthStatusService.execute();
    response.status(200).json(status.toJSON());
  };
}
