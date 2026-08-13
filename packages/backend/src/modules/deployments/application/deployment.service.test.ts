import { describe, expect, it, vi } from 'vitest';

import type {
  DeploymentRow,
  IDeploymentRepository,
} from '../infrastructure/deployment.repository.js';

import { DeploymentService } from './deployment.service.js';

vi.mock('../../../shared/audit/audit-logger.js', () => ({
  auditLogger: { record: vi.fn().mockResolvedValue(undefined) },
}));

function buildDeploymentRow(overrides: Partial<DeploymentRow> = {}): DeploymentRow {
  return {
    id: 'dep-1',
    entity_id: 'entity-1',
    environment: 'production',
    version: 'abc123',
    status: 'pending',
    triggered_by_user_id: null,
    started_at: new Date(),
    finished_at: null,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function buildRepositoryMock(
  overrides: Partial<IDeploymentRepository> = {},
): IDeploymentRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByExternalId: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    ...overrides,
  };
}

describe('DeploymentService', () => {
  it('lanca NotFoundError ao buscar deployment inexistente', async () => {
    const repository = buildRepositoryMock({ findById: vi.fn().mockResolvedValue(undefined) });
    const service = new DeploymentService(repository);

    await expect(service.getById('missing')).rejects.toThrow('nao encontrado');
  });

  it('lista deployments delegando filtros e paginacao ao repositorio', async () => {
    const repository = buildRepositoryMock({
      findMany: vi.fn().mockResolvedValue({ items: [buildDeploymentRow()], total: 1 }),
    });
    const service = new DeploymentService(repository);

    const result = await service.list({ status: 'pending' }, { page: 1, pageSize: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 1 });
    expect(repository.findMany).toHaveBeenCalledWith(
      { status: 'pending' },
      { page: 1, pageSize: 20 },
    );
  });

  it('cria um deployment e retorna o registro criado', async () => {
    const repository = buildRepositoryMock({
      create: vi.fn().mockResolvedValue(buildDeploymentRow({ status: 'pending' })),
    });
    const service = new DeploymentService(repository);

    const result = await service.create(
      { entityId: 'entity-1', environment: 'production', version: 'abc123', status: 'pending' },
      {},
    );

    expect(result.status).toBe('pending');
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
