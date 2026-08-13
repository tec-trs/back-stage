import { describe, expect, it } from 'vitest';

import { HealthStatusEntity } from '../domain/health-status.entity.js';
import type { HealthRepository } from '../infrastructure/process-health.repository.js';

import { GetHealthStatusService } from './get-health-status.service.js';

describe('GetHealthStatusService', () => {
  it('retorna o status atual a partir do repositorio', async () => {
    const fakeRepository: HealthRepository = {
      getCurrentStatus: async () =>
        new HealthStatusEntity('ok', 10, '2026-01-01T00:00:00.000Z', '0.1.0'),
    };

    const service = new GetHealthStatusService(fakeRepository);
    const result = await service.execute();

    expect(result.status).toBe('ok');
    expect(result.version).toBe('0.1.0');
    expect(result.uptimeSeconds).toBe(10);
  });
});
