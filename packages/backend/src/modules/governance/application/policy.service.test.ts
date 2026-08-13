import { describe, expect, it, vi } from 'vitest';

import { Policy } from '../domain/policy.entity.js';
import type { IPolicyRepository } from '../infrastructure/policy.repository.js';

import { PolicyService } from './policy.service.js';

vi.mock('../../../shared/audit/audit-logger.js', () => ({
  auditLogger: { record: vi.fn().mockResolvedValue(undefined) },
}));

function buildPolicy(overrides: Partial<ConstructorParameters<typeof Policy>[0]> = {}): Policy {
  return new Policy({
    id: 'policy-1',
    name: 'Producao exige owner',
    slug: 'producao-exige-owner',
    description: null,
    policy_type: 'quality',
    definition: JSON.stringify({ rules: [], combinator: 'AND' }),
    is_active: true,
    metadata: {},
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildRepositoryMock(overrides: Partial<IPolicyRepository> = {}): IPolicyRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    findActive: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
    ...overrides,
  };
}

describe('PolicyService', () => {
  it('lanca ValidationError quando a definicao da policy e invalida', async () => {
    const repository = buildRepositoryMock();
    const service = new PolicyService(repository);

    await expect(
      service.create(
        {
          name: 'x',
          slug: 'x',
          policyType: 'quality',
          definition: 'nao-e-json',
        },
        {},
      ),
    ).rejects.toThrow('JSON malformado');

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('lanca ConflictError ao criar policy com slug duplicado', async () => {
    const repository = buildRepositoryMock({
      findBySlug: vi.fn().mockResolvedValue(buildPolicy()),
    });
    const service = new PolicyService(repository);

    await expect(
      service.create(
        {
          name: 'x',
          slug: 'producao-exige-owner',
          policyType: 'quality',
          definition: JSON.stringify({ rules: [], combinator: 'AND' }),
        },
        {},
      ),
    ).rejects.toThrow('Ja existe uma policy');
  });

  it('lanca NotFoundError ao buscar policy inexistente', async () => {
    const repository = buildRepositoryMock({ findById: vi.fn().mockResolvedValue(undefined) });
    const service = new PolicyService(repository);

    await expect(service.getById('missing')).rejects.toThrow('nao encontrado');
  });

  it('cria a policy quando a definicao e valida e o slug e unico', async () => {
    const repository = buildRepositoryMock({
      findBySlug: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(buildPolicy()),
    });
    const service = new PolicyService(repository);

    const result = await service.create(
      {
        name: 'Producao exige owner',
        slug: 'producao-exige-owner',
        policyType: 'quality',
        definition: JSON.stringify({ rules: [], combinator: 'AND' }),
      },
      {},
    );

    expect(result.slug).toBe('producao-exige-owner');
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
