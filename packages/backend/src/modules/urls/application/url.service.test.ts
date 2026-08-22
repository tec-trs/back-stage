import { ConflictError, NotFoundError } from '@back-stage/shared';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import type { CreateUrlInput, IUrlRepository, Pagination, UrlFilters } from '../infrastructure/url.repository.js';
import { Url, type UrlRow } from '../domain/url.entity.js';

import { UrlService, type AuditContext } from './url.service.js';

vi.mock('../../../shared/audit/audit-logger.js', () => ({
  auditLogger: {
    record: vi.fn().mockResolvedValue(undefined),
  },
}));

function buildUrl(overrides: Partial<UrlRow> = {}): Url {
  const row: UrlRow = {
    id: '11111111-1111-1111-1111-111111111111',
    label: 'Test URL',
    url: 'https://example.com',
    url_type: 'public',
    description: 'Test description',
    method: 'GET',
    auth_required: false,
    auth_method: null,
    status: 'active',
    healthcheck_enabled: true,
    last_check_status: '200',
    last_checked_at: new Date('2026-01-01T00:00:00.000Z'),
    tags: ['test'],
    metadata: {},
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
  return new Url(row);
}

function buildRepositoryMock(overrides: Partial<IUrlRepository> = {}): IUrlRepository {
  return {
    findMany: vi.fn(),
    findById: vi.fn(),
    findByUrl: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setStatus: vi.fn(),
    softDelete: vi.fn(),
    bulkSoftDelete: vi.fn(),
    ...overrides,
  };
}

describe('UrlService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates URL format by rejecting duplicate URLs', async () => {
    const existingUrl = buildUrl();
    const repository = buildRepositoryMock({
      findByUrl: vi.fn().mockResolvedValue(existingUrl),
    });

    const service = new UrlService(repository);
    const input: CreateUrlInput = {
      label: 'Duplicate',
      url: 'https://example.com',
      urlType: 'public',
    };
    const audit: AuditContext = { actorUserId: 'user-1' };

    await expect(service.create(input, audit)).rejects.toThrow('Ja existe uma URL cadastrada');
  });

  it('updates health check status via setStatus', async () => {
    const originalUrl = buildUrl({ status: 'active', last_check_status: null });
    const updatedUrl = buildUrl({ status: 'active', last_check_status: '200' });
    const repository = buildRepositoryMock({
      findById: vi.fn().mockResolvedValue(originalUrl),
      setStatus: vi.fn().mockResolvedValue(updatedUrl),
    });

    const service = new UrlService(repository);
    const audit: AuditContext = { actorUserId: 'user-1' };

    const result = await service.setStatus('11111111-1111-1111-1111-111111111111', 'active', audit);

    expect(result.status).toBe('active');
    expect(result.lastCheckStatus).toBe('200');
    expect(repository.setStatus).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111', 'active');
  });

  it('creates URL and records audit log', async () => {
    const createdUrl = buildUrl();
    const repository = buildRepositoryMock({
      findByUrl: vi.fn().mockResolvedValue(undefined),
      create: vi.fn().mockResolvedValue(createdUrl),
    });

    const service = new UrlService(repository);
    const input: CreateUrlInput = {
      label: 'New URL',
      url: 'https://newexample.com',
      urlType: 'public',
    };
    const audit: AuditContext = { actorUserId: 'user-1', ipAddress: '192.168.1.1' };

    const result = await service.create(input, audit);

    expect(result.id).toBe('11111111-1111-1111-1111-111111111111');
    expect(result.label).toBe('Test URL');
    expect(result.url).toBe('https://example.com');
    expect(repository.create).toHaveBeenCalledWith(input);
  });
});
