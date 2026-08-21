import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundError, ValidationError } from '@back-stage/shared';

import type { CreateVIPDto, VIP } from '../domain/vip.types.js';
import { VIPService } from './vip.service.js';

describe('VIPService', () => {
  let service: VIPService;
  let mockDb: any;
  let mockRepository: any;

  const mockVIP = (): VIP => ({
    id: 'vip-001',
    organizationId: 'org-001',
    hostname: 'vip-01.local',
    displayName: 'VIP 01',
    description: 'Test VIP',
    vipAddress: '192.168.1.100',
    loadBalancerType: 'nginx',
    healthCheckInterval: 30,
    healthCheckPath: '/health',
    status: 'active',
    environment: 'production',
    criticality: 'high',
    ownerTeam: 'platform',
    ownerUserId: 'user-001',
    costCenter: 'cc-001',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

  const mockServer = () => ({
    id: 'server-001',
    organization_id: 'org-001',
    hostname: 'web-01',
    status: 'active',
  });

  const mockVIPServer = () => ({
    id: 'vip-server-001',
    vip_id: 'vip-001',
    server_id: 'server-001',
    order: 0,
    organization_id: 'org-001',
    deleted_at: null,
  });

  const createMockDbQuery = (firstValue?: any) => ({
    where: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(firstValue || null),
      update: vi.fn().mockResolvedValue(1),
    }),
    first: vi.fn().mockResolvedValue(firstValue || null),
    insert: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(1),
    join: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue([]),
      }),
    }),
    orderBy: vi.fn().mockResolvedValue([]),
  });

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      getMembers: vi.fn(),
      addServer: vi.fn(),
      removeServer: vi.fn(),
      getServers: vi.fn(),
    };

    // Mock Knex database instance as a function that returns query builder
    mockDb = vi.fn((table: string) => createMockDbQuery());
    mockDb.fn = {
      now: vi.fn(() => new Date()),
    };

    // Create service instance and inject mocked repository
    service = new VIPService(mockDb);
    service['repository'] = mockRepository;
  });

  describe('createVIP', () => {
    it('creates VIP with valid hostname', async () => {
      const createDto: CreateVIPDto = { hostname: 'vip-01.local' };
      const vip = mockVIP();

      mockRepository.create.mockResolvedValue(vip);

      const result = await service.createVIP('org-001', createDto);

      expect(result.id).toBe('vip-001');
      expect(result.hostname).toBe('vip-01.local');
      expect(mockRepository.create).toHaveBeenCalledWith('org-001', createDto);
    });

    it('rejects empty hostname', async () => {
      const createDto: CreateVIPDto = { hostname: '' };

      await expect(service.createVIP('org-001', createDto)).rejects.toThrow(ValidationError);
    });
  });

  describe('addServerToVIP', () => {
    it('adds server and creates graph relationship', async () => {
      const vip = mockVIP();
      const server = mockServer();

      // Mock getVIP check (findById)
      mockRepository.findById.mockResolvedValue(vip);

      // Create a custom mock for this test
      const serversWhereChain = {
        first: vi.fn().mockResolvedValue(server),
      };
      const vipServersWhereChain = {
        first: vi.fn().mockResolvedValue(null),
      };
      const resourceRelationshipsChain = {
        insert: vi.fn().mockResolvedValue([]),
      };

      mockDb = vi.fn((table: string) => {
        if (table === 'servers') {
          return {
            where: vi.fn().mockReturnValue(serversWhereChain),
          };
        }
        if (table === 'vip_servers') {
          return {
            where: vi.fn().mockReturnValue(vipServersWhereChain),
          };
        }
        if (table === 'resource_relationships') {
          return resourceRelationshipsChain;
        }
        return createMockDbQuery();
      });
      mockDb.fn = { now: vi.fn(() => new Date()) };

      service['db'] = mockDb;

      // Mock getMembers to return empty array for order calculation
      mockRepository.getMembers.mockResolvedValue([]);
      mockRepository.addServer.mockResolvedValue(mockVIPServer());
      mockRepository.findById.mockResolvedValue(vip);

      const result = await service.addServerToVIP('vip-001', 'org-001', 'server-001');

      expect(result.id).toBe('vip-001');
      expect(mockRepository.addServer).toHaveBeenCalledWith('vip-001', 'org-001', 'server-001', 0);
    });

    it('rejects duplicate server in VIP', async () => {
      const vip = mockVIP();
      const server = mockServer();
      const existingMember = mockVIPServer();

      // Mock getVIP check
      mockRepository.findById.mockResolvedValue(vip);

      // Create a custom mock for this test
      const serversWhereChain = {
        first: vi.fn().mockResolvedValue(server),
      };
      const vipServersWhereChain = {
        first: vi.fn().mockResolvedValue(existingMember),
      };

      mockDb = vi.fn((table: string) => {
        if (table === 'servers') {
          return {
            where: vi.fn().mockReturnValue(serversWhereChain),
          };
        }
        if (table === 'vip_servers') {
          return {
            where: vi.fn().mockReturnValue(vipServersWhereChain),
          };
        }
        return createMockDbQuery();
      });
      mockDb.fn = { now: vi.fn(() => new Date()) };

      service['db'] = mockDb;

      await expect(service.addServerToVIP('vip-001', 'org-001', 'server-001')).rejects.toThrow(
        ValidationError
      );
    });

    it('rejects non-existent server', async () => {
      const vip = mockVIP();

      // Mock getVIP check
      mockRepository.findById.mockResolvedValue(vip);

      // Create a custom mock for this test
      const serversWhereChain = {
        first: vi.fn().mockResolvedValue(null),
      };

      mockDb = vi.fn((table: string) => {
        if (table === 'servers') {
          return {
            where: vi.fn().mockReturnValue(serversWhereChain),
          };
        }
        return createMockDbQuery();
      });
      mockDb.fn = { now: vi.fn(() => new Date()) };

      service['db'] = mockDb;

      await expect(service.addServerToVIP('vip-001', 'org-001', 'server-001')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('removeServerFromVIP', () => {
    it('removes server and deletes graph relationship', async () => {
      const vip = mockVIP();

      // Mock getVIP check
      mockRepository.findById.mockResolvedValue(vip);

      // Mock removeServer to return true
      mockRepository.removeServer.mockResolvedValue(true);

      // Create a custom mock for this test
      const resourceRelationshipsWhereChain = {
        update: vi.fn().mockResolvedValue(1),
      };

      mockDb = vi.fn((table: string) => {
        if (table === 'resource_relationships') {
          return {
            where: vi.fn().mockReturnValue(resourceRelationshipsWhereChain),
          };
        }
        return createMockDbQuery();
      });
      mockDb.fn = { now: vi.fn(() => new Date()) };

      service['db'] = mockDb;

      const result = await service.removeServerFromVIP('vip-001', 'org-001', 'server-001');

      expect(result.id).toBe('vip-001');
      expect(mockRepository.removeServer).toHaveBeenCalledWith('vip-001', 'org-001', 'server-001');
    });
  });

  describe('getVIPServers', () => {
    it('returns list of servers in VIP', async () => {
      const vip = mockVIP();
      const servers = [mockServer()];

      // Mock getVIP check
      mockRepository.findById.mockResolvedValue(vip);

      // Mock getServers
      mockRepository.getServers.mockResolvedValue(servers);

      const result = await service.getVIPServers('vip-001', 'org-001');

      expect(result).toEqual(servers);
      expect(mockRepository.getServers).toHaveBeenCalledWith('vip-001', 'org-001');
    });
  });
});
