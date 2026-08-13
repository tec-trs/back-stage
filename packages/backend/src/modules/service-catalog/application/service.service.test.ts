import { describe, expect, it, vi } from 'vitest';

import { Service } from '../domain/service.entity.js';
import type { IServiceRepository } from '../infrastructure/service.repository.js';

import { ServiceService } from './service.service.js';

function buildService(overrides: Partial<ConstructorParameters<typeof Service>[0]> = {}): Service {
  return new Service({
    id: '11111111-1111-1111-1111-111111111111',
    type: 'service',
    name: 'backend-api',
    namespace: 'default',
    title: 'Backend API',
    description: null,
    lifecycle: 'production',
    owner_team_id: null,
    system_id: null,
    repository_url: null,
    metadata: {},
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildRepositoryMock(overrides: Partial<IServiceRepository> = {}): IServiceRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByNamespaceAndName: vi.fn(),
    search: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    ...overrides,
  };
}

describe('ServiceService', () => {
  it('lanca ConflictError ao criar service duplicado no mesmo namespace', async () => {
    const repository = buildRepositoryMock({
      findByNamespaceAndName: vi.fn().mockResolvedValue(buildService()),
    });

    const service = new ServiceService(repository);

    await expect(
      service.create(
        { type: 'service', name: 'backend-api', namespace: 'default', lifecycle: 'production' },
        {},
      ),
    ).rejects.toThrow('Ja existe um service');
  });

  it('lanca NotFoundError ao buscar service inexistente', async () => {
    const repository = buildRepositoryMock({
      findById: vi.fn().mockResolvedValue(undefined),
    });

    const service = new ServiceService(repository);

    await expect(service.getById('missing-id')).rejects.toThrow('nao encontrado');
  });

  it('lista services delegando paginacao e ordenacao ao repositorio', async () => {
    const repository = buildRepositoryMock({
      findMany: vi.fn().mockResolvedValue({ items: [buildService()], total: 1 }),
    });

    const service = new ServiceService(repository);
    const result = await service.list(
      {},
      { sortBy: 'name', sortOrder: 'asc' },
      { page: 1, pageSize: 20 },
    );

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 1 });
  });
});
