import { describe, expect, it, vi } from 'vitest';

import { Application } from '../domain/application.entity.js';
import type { IApplicationRepository } from '../infrastructure/application.repository.js';

import { ApplicationService } from './application.service.js';

vi.mock('../../../shared/audit/audit-logger.js', () => ({
  auditLogger: { record: vi.fn().mockResolvedValue(undefined) },
}));

function buildApplication(
  overrides: Partial<ConstructorParameters<typeof Application>[0]> = {},
): Application {
  return new Application({
    id: '11111111-1111-1111-1111-111111111111',
    code: 'billing-api',
    display_name: 'Billing API',
    description: null,
    app_type: 'api_backend',
    business_category: null,
    criticality: 'high',
    status: 'active',
    language: 'TypeScript',
    framework: 'Express',
    current_version: '1.0.0',
    repository_url: null,
    cicd_url: null,
    container_image: null,
    data_classification: null,
    auth_method: null,
    owner_team: null,
    owner_user_id: null,
    cost_center: null,
    monthly_cost_estimate: null,
    docs_url: null,
    api_spec_url: null,
    runbook_url: null,
    monitoring_url: null,
    sla: null,
    health_check_url: null,
    metadata: {},
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildRepositoryMock(
  overrides: Partial<IApplicationRepository> = {},
): IApplicationRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    softDelete: vi.fn(),
    ...overrides,
  };
}

describe('ApplicationService', () => {
  it('lanca ConflictError ao criar aplicacao com codigo duplicado', async () => {
    const repository = buildRepositoryMock({
      findByCode: vi.fn().mockResolvedValue(buildApplication()),
    });
    const service = new ApplicationService(repository);

    await expect(
      service.create({ code: 'billing-api', displayName: 'Billing API', appType: 'api_backend' }, {}),
    ).rejects.toThrow("Ja existe uma aplicacao com o codigo 'billing-api'");
  });

  it('lanca NotFoundError ao buscar aplicacao inexistente', async () => {
    const repository = buildRepositoryMock({ findById: vi.fn().mockResolvedValue(undefined) });
    const service = new ApplicationService(repository);

    await expect(service.getById('missing-id')).rejects.toThrow('nao encontrado');
  });

  it('cria uma aplicacao quando o codigo e unico', async () => {
    const repository = buildRepositoryMock({
      findByCode: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(buildApplication()),
    });
    const service = new ApplicationService(repository);

    const application = await service.create(
      { code: 'billing-api', displayName: 'Billing API', appType: 'api_backend' },
      {},
    );

    expect(application.code).toBe('billing-api');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'billing-api', appType: 'api_backend' }),
    );
  });

  it('altera o status de uma aplicacao existente', async () => {
    const repository = buildRepositoryMock({
      findById: vi.fn().mockResolvedValue(buildApplication()),
      setStatus: vi.fn().mockResolvedValue(buildApplication({ status: 'maintenance' })),
    });
    const service = new ApplicationService(repository);

    const application = await service.setStatus(
      '11111111-1111-1111-1111-111111111111',
      'maintenance',
      {},
    );

    expect(application.status).toBe('maintenance');
  });

  it('elimina uma aplicacao existente', async () => {
    const repository = buildRepositoryMock({
      findById: vi.fn().mockResolvedValue(buildApplication()),
      softDelete: vi.fn().mockResolvedValue(true),
    });
    const service = new ApplicationService(repository);

    await service.delete('11111111-1111-1111-1111-111111111111', {});

    expect(repository.softDelete).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
  });

  it('lista aplicacoes delegando paginacao e filtros ao repositorio', async () => {
    const repository = buildRepositoryMock({
      findMany: vi.fn().mockResolvedValue({ items: [buildApplication()], total: 1 }),
    });
    const service = new ApplicationService(repository);

    const result = await service.list({}, { page: 1, pageSize: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 1 });
  });
});
