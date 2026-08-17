import { describe, expect, it, vi } from 'vitest';

import { Server } from '../domain/server.entity.js';
import type { IServerRepository } from '../infrastructure/server.repository.js';

import { ServerService } from './server.service.js';

vi.mock('../../../shared/audit/audit-logger.js', () => ({
  auditLogger: { record: vi.fn().mockResolvedValue(undefined) },
}));

function buildServer(overrides: Partial<ConstructorParameters<typeof Server>[0]> = {}): Server {
  return new Server({
    id: '11111111-1111-1111-1111-111111111111',
    hostname: 'web-01',
    display_name: 'Web 01',
    description: null,
    server_type: 'vm',
    provider: 'aws',
    cpu_cores: 4,
    cpu_model: null,
    ram_gb: 16,
    hypervisor: null,
    os_name: 'Ubuntu',
    os_version: '22.04',
    os_architecture: 'x86_64',
    os_eol_date: null,
    private_ips: ['10.0.0.5'],
    public_ip: null,
    vlan_subnet: null,
    gateway: null,
    dns_servers: [],
    access_method: 'ssh',
    security_group: null,
    data_classification: null,
    status: 'active',
    environment: 'production',
    owner_team: null,
    owner_user_id: null,
    cost_center: null,
    has_backup: false,
    backup_policy: null,
    last_backup_at: null,
    monthly_cost_estimate: null,
    monitoring_url: null,
    metadata: {},
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildRepositoryMock(overrides: Partial<IServerRepository> = {}): IServerRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByHostname: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    softDelete: vi.fn(),
    hasLinkedApplications: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe('ServerService', () => {
  it('lanca ConflictError ao criar servidor com hostname duplicado', async () => {
    const repository = buildRepositoryMock({
      findByHostname: vi.fn().mockResolvedValue(buildServer()),
    });
    const service = new ServerService(repository);

    await expect(
      service.create(
        { hostname: 'web-01', serverType: 'vm', provider: 'aws', environment: 'production' },
        {},
      ),
    ).rejects.toThrow("Ja existe um servidor com o hostname 'web-01'");
  });

  it('lanca NotFoundError ao buscar servidor inexistente', async () => {
    const repository = buildRepositoryMock({ findById: vi.fn().mockResolvedValue(undefined) });
    const service = new ServerService(repository);

    await expect(service.getById('missing-id')).rejects.toThrow('nao encontrado');
  });

  it('cria um servidor quando o hostname e unico', async () => {
    const repository = buildRepositoryMock({
      findByHostname: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(buildServer()),
    });
    const service = new ServerService(repository);

    const server = await service.create(
      { hostname: 'web-01', serverType: 'vm', provider: 'aws', environment: 'production' },
      {},
    );

    expect(server.hostname).toBe('web-01');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: 'web-01', environment: 'production' }),
    );
  });

  it('altera o status de um servidor existente', async () => {
    const repository = buildRepositoryMock({
      findById: vi.fn().mockResolvedValue(buildServer()),
      setStatus: vi.fn().mockResolvedValue(buildServer({ status: 'maintenance' })),
    });
    const service = new ServerService(repository);

    const server = await service.setStatus('11111111-1111-1111-1111-111111111111', 'maintenance', {});

    expect(server.status).toBe('maintenance');
    expect(repository.setStatus).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      'maintenance',
    );
  });

  it('elimina um servidor existente', async () => {
    const repository = buildRepositoryMock({
      findById: vi.fn().mockResolvedValue(buildServer()),
      softDelete: vi.fn().mockResolvedValue(true),
    });
    const service = new ServerService(repository);

    await service.delete('11111111-1111-1111-1111-111111111111', {});

    expect(repository.softDelete).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
  });

  it('lista servidores delegando paginacao e filtros ao repositorio', async () => {
    const repository = buildRepositoryMock({
      findMany: vi.fn().mockResolvedValue({ items: [buildServer()], total: 1 }),
    });
    const service = new ServerService(repository);

    const result = await service.list({}, { page: 1, pageSize: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 1 });
  });
});
