import type { HealthStatusEntity } from '../domain/health-status.entity.js';
import type { HealthRepository } from '../infrastructure/process-health.repository.js';

export class GetHealthStatusService {
  public constructor(private readonly healthRepository: HealthRepository) {}

  public async execute(): Promise<HealthStatusEntity> {
    return this.healthRepository.getCurrentStatus();
  }
}
