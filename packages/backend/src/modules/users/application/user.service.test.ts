import { describe, expect, it, vi } from 'vitest';

import { User } from '../domain/user.entity.js';
import type { IUserRepository } from '../infrastructure/user.repository.js';

import { UserService } from './user.service.js';

vi.mock('../../../shared/audit/audit-logger.js', () => ({
  auditLogger: { record: vi.fn().mockResolvedValue(undefined) },
}));

function buildUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: '11111111-1111-1111-1111-111111111111',
    email: 'jane.doe@back-stage.dev',
    full_name: 'Jane Doe',
    avatar_url: null,
    is_active: true,
    roles: ['viewer'],
    metadata: {},
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

function buildRepositoryMock(overrides: Partial<IUserRepository> = {}): IUserRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setActive: vi.fn(),
    ...overrides,
  };
}

describe('UserService', () => {
  it('lanca ConflictError ao criar usuario com email duplicado', async () => {
    const repository = buildRepositoryMock({
      findByEmail: vi.fn().mockResolvedValue(buildUser()),
    });
    const service = new UserService(repository);

    await expect(
      service.create(
        {
          email: 'jane.doe@back-stage.dev',
          fullName: 'Jane Doe',
          password: 'ChangeMe123!',
          roles: ['viewer'],
        },
        {},
      ),
    ).rejects.toThrow('Ja existe um usuario');
  });

  it('lanca NotFoundError ao buscar usuario inexistente', async () => {
    const repository = buildRepositoryMock({ findById: vi.fn().mockResolvedValue(undefined) });
    const service = new UserService(repository);

    await expect(service.getById('missing-id')).rejects.toThrow('nao encontrado');
  });

  it('cria um usuario com senha com hash quando o email e unico', async () => {
    const repository = buildRepositoryMock({
      findByEmail: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(buildUser()),
    });
    const service = new UserService(repository);

    const user = await service.create(
      {
        email: 'jane.doe@back-stage.dev',
        fullName: 'Jane Doe',
        password: 'ChangeMe123!',
        roles: ['viewer'],
      },
      {},
    );

    expect(user.email).toBe('jane.doe@back-stage.dev');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'jane.doe@back-stage.dev', roles: ['viewer'] }),
    );
  });

  it('lanca ValidationError ao tentar inativar a propria conta', async () => {
    const repository = buildRepositoryMock({
      findById: vi.fn().mockResolvedValue(buildUser()),
    });
    const service = new UserService(repository);

    await expect(
      service.setActive('11111111-1111-1111-1111-111111111111', false, {
        actorUserId: '11111111-1111-1111-1111-111111111111',
      }),
    ).rejects.toThrow('Voce nao pode inativar sua propria conta');
  });

  it('inativa um usuario diferente do ator autenticado', async () => {
    const repository = buildRepositoryMock({
      findById: vi.fn().mockResolvedValue(buildUser()),
      setActive: vi.fn().mockResolvedValue(buildUser({ is_active: false })),
    });
    const service = new UserService(repository);

    const user = await service.setActive('11111111-1111-1111-1111-111111111111', false, {
      actorUserId: '22222222-2222-2222-2222-222222222222',
    });

    expect(user.isActive).toBe(false);
    expect(repository.setActive).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      false,
    );
  });

  it('lista usuarios delegando paginacao e filtros ao repositorio', async () => {
    const repository = buildRepositoryMock({
      findMany: vi.fn().mockResolvedValue({ items: [buildUser()], total: 1 }),
    });
    const service = new UserService(repository);

    const result = await service.list({}, { page: 1, pageSize: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 20, total: 1 });
  });
});
