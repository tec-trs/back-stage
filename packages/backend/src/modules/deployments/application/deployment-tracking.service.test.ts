import { describe, expect, it, vi } from 'vitest';

import type { NormalizedDeploymentEvent } from '../domain/deployment-event.js';
import type { ICatalogEntityLookup } from '../infrastructure/catalog-entity-lookup.repository.js';
import type {
  DeploymentRow,
  IDeploymentRepository,
} from '../infrastructure/deployment.repository.js';

import { DeploymentTrackingService } from './deployment-tracking.service.js';

vi.mock('../../../shared/audit/audit-logger.js', () => ({
  auditLogger: { record: vi.fn().mockResolvedValue(undefined) },
}));

function buildEvent(overrides: Partial<NormalizedDeploymentEvent> = {}): NormalizedDeploymentEvent {
  return {
    externalId: 'github-deployment-1',
    repositoryUrl: 'https://github.com/back-stage/back-stage',
    environment: 'production',
    version: 'abcdef1',
    eventType: 'deployment.started',
    provider: 'github',
    ...overrides,
  };
}

function buildDeploymentRow(overrides: Partial<DeploymentRow> = {}): DeploymentRow {
  return {
    id: 'dep-1',
    entity_id: 'entity-1',
    environment: 'production',
    version: 'abcdef1',
    status: 'running',
    triggered_by_user_id: null,
    started_at: new Date(),
    finished_at: null,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

describe('DeploymentTrackingService', () => {
  it('retorna matched:false quando nenhuma entidade corresponde ao repositorio', async () => {
    const lookup: ICatalogEntityLookup = {
      findByRepositoryUrl: vi.fn().mockResolvedValue(undefined),
    };
    const repository: IDeploymentRepository = {
      findMany: vi.fn(),
      findById: vi.fn(),
      findByExternalId: vi.fn(),
      create: vi.fn(),
      updateStatus: vi.fn(),
    };

    const service = new DeploymentTrackingService(repository, lookup);
    const result = await service.handleEvent(buildEvent());

    expect(result).toEqual({ matched: false });
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('cria um novo deployment quando o external id ainda nao existe', async () => {
    const lookup: ICatalogEntityLookup = {
      findByRepositoryUrl: vi.fn().mockResolvedValue({ id: 'entity-1' }),
    };
    const repository: IDeploymentRepository = {
      findMany: vi.fn(),
      findById: vi.fn(),
      findByExternalId: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(buildDeploymentRow()),
      updateStatus: vi.fn(),
    };

    const service = new DeploymentTrackingService(repository, lookup);
    const result = await service.handleEvent(buildEvent());

    expect(result).toEqual({ matched: true, deploymentId: 'dep-1' });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 'entity-1', status: 'running' }),
    );
  });

  it('atualiza o status quando o external id ja existe', async () => {
    const lookup: ICatalogEntityLookup = {
      findByRepositoryUrl: vi.fn().mockResolvedValue({ id: 'entity-1' }),
    };
    const repository: IDeploymentRepository = {
      findMany: vi.fn(),
      findById: vi.fn(),
      findByExternalId: vi.fn().mockResolvedValue(buildDeploymentRow({ status: 'running' })),
      create: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue(buildDeploymentRow({ status: 'succeeded' })),
    };

    const service = new DeploymentTrackingService(repository, lookup);
    const result = await service.handleEvent(buildEvent({ eventType: 'deployment.completed' }));

    expect(result.matched).toBe(true);
    expect(repository.updateStatus).toHaveBeenCalledWith(
      'dep-1',
      expect.objectContaining({ status: 'succeeded' }),
    );
    expect(repository.create).not.toHaveBeenCalled();
  });
});
