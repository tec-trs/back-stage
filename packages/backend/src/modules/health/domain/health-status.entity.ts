import type { HealthState, HealthStatus } from '@back-stage/shared';

export class HealthStatusEntity {
  public constructor(
    public readonly status: HealthState,
    public readonly uptimeSeconds: number,
    public readonly timestamp: string,
    public readonly version: string,
  ) {}

  public toJSON(): HealthStatus {
    return {
      status: this.status,
      uptimeSeconds: this.uptimeSeconds,
      timestamp: this.timestamp,
      version: this.version,
    };
  }
}
