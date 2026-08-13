import { checkDatabaseConnection } from '../../../database/connection.js';
import { HealthStatusEntity } from '../domain/health-status.entity.js';

export interface HealthRepository {
  getCurrentStatus(): Promise<HealthStatusEntity>;
}

export class ProcessHealthRepository implements HealthRepository {
  public constructor(private readonly appVersion: string) {}

  public async getCurrentStatus(): Promise<HealthStatusEntity> {
    const isDatabaseHealthy = await checkDatabaseConnection();

    return new HealthStatusEntity(
      isDatabaseHealthy ? 'ok' : 'degraded',
      process.uptime(),
      new Date().toISOString(),
      this.appVersion,
    );
  }
}
