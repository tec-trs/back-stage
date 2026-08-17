import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { IResourceRelationshipRepository } from '../infrastructure/resource-relationship.repository.js';
import { GraphService } from './graph.service.js';

describe('GraphService', () => {
  let mockRepository: IResourceRelationshipRepository;
  let service: GraphService;

  beforeEach(() => {
    mockRepository = {
      getFullGraph: vi.fn(),
      getSubgraph: vi.fn(),
      getTransitiveImpact: vi.fn(),
      createRelationship: vi.fn(),
      deleteRelationship: vi.fn(),
    };
    service = new GraphService(mockRepository);
  });

  describe('simulateImpact', () => {
    it('deve chamar getTransitiveImpact com os parâmetros corretos', async () => {
      const mockImpactResult = {
        impactedResources: [
          { resourceId: 'app-1', resourceType: 'application', depth: 1 },
          { resourceId: 'db-1', resourceType: 'database', depth: 2 },
        ],
        byType: { application: 1, database: 1 },
        byDepth: { 1: 1, 2: 1 },
        totalImpacted: 2,
        hasCycle: false,
      };

      (mockRepository.getTransitiveImpact as any).mockResolvedValue(mockImpactResult);

      const result = await service.simulateImpact('server', 'server-1');

      expect(mockRepository.getTransitiveImpact).toHaveBeenCalledWith('server', 'server-1');
      expect(result).toEqual(mockImpactResult);
      expect(result.totalImpacted).toBe(2);
      expect(result.byType.application).toBe(1);
    });

    it('deve agrupar recursos impactados por tipo', async () => {
      const mockImpactResult = {
        impactedResources: [
          { resourceId: 'app-1', resourceType: 'application', depth: 1 },
          { resourceId: 'app-2', resourceType: 'application', depth: 1 },
          { resourceId: 'db-1', resourceType: 'database', depth: 2 },
          { resourceId: 'url-1', resourceType: 'url', depth: 3 },
        ],
        byType: { application: 2, database: 1, url: 1 },
        byDepth: { 1: 2, 2: 1, 3: 1 },
        totalImpacted: 4,
        hasCycle: false,
      };

      (mockRepository.getTransitiveImpact as any).mockResolvedValue(mockImpactResult);

      const result = await service.simulateImpact('application', 'app-master');

      expect(result.byType.application).toBe(2);
      expect(result.byType.database).toBe(1);
      expect(result.byType.url).toBe(1);
      expect(result.totalImpacted).toBe(4);
    });

    it('deve detectar ciclos e incluir flag hasCycle', async () => {
      const mockImpactResult = {
        impactedResources: [
          { resourceId: 'app-1', resourceType: 'application', depth: 1 },
          { resourceId: 'app-2', resourceType: 'application', depth: 2 },
        ],
        byType: { application: 2 },
        byDepth: { 1: 1, 2: 1 },
        totalImpacted: 2,
        hasCycle: true,
      };

      (mockRepository.getTransitiveImpact as any).mockResolvedValue(mockImpactResult);

      const result = await service.simulateImpact('application', 'app-1');

      expect(result.hasCycle).toBe(true);
    });

    it('deve retornar impacto vazio para recurso isolado', async () => {
      const mockImpactResult = {
        impactedResources: [],
        byType: {},
        byDepth: {},
        totalImpacted: 0,
        hasCycle: false,
      };

      (mockRepository.getTransitiveImpact as any).mockResolvedValue(mockImpactResult);

      const result = await service.simulateImpact('database', 'isolated-db');

      expect(result.totalImpacted).toBe(0);
      expect(result.impactedResources.length).toBe(0);
    });

    it('deve agrupar recursos por profundidade corretamente', async () => {
      const mockImpactResult = {
        impactedResources: [
          { resourceId: 'res-1', resourceType: 'application', depth: 1 },
          { resourceId: 'res-2', resourceType: 'application', depth: 1 },
          { resourceId: 'res-3', resourceType: 'database', depth: 2 },
          { resourceId: 'res-4', resourceType: 'url', depth: 3 },
          { resourceId: 'res-5', resourceType: 'url', depth: 3 },
        ],
        byType: { application: 2, database: 1, url: 2 },
        byDepth: { 1: 2, 2: 1, 3: 2 },
        totalImpacted: 5,
        hasCycle: false,
      };

      (mockRepository.getTransitiveImpact as any).mockResolvedValue(mockImpactResult);

      const result = await service.simulateImpact('server', 'critical-server');

      expect(result.byDepth[1]).toBe(2);
      expect(result.byDepth[2]).toBe(1);
      expect(result.byDepth[3]).toBe(2);
    });
  });

  describe('getFullGraph', () => {
    it('deve chamar getFullGraph do repositório', async () => {
      const mockGraphResult = {
        nodes: [],
        edges: [],
        total: 0,
      };

      (mockRepository.getFullGraph as any).mockResolvedValue(mockGraphResult);

      const result = await service.getFullGraph({}, { page: 1, pageSize: 100 });

      expect(mockRepository.getFullGraph).toHaveBeenCalledWith({}, { page: 1, pageSize: 100 });
      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
  });

  describe('getSubgraph', () => {
    it('deve chamar getSubgraph do repositório com profundidade', async () => {
      const mockGraphResult = {
        nodes: [{ id: 'app-1', label: 'App 1', resourceType: 'application' }],
        edges: [],
      };

      (mockRepository.getSubgraph as any).mockResolvedValue(mockGraphResult);

      const result = await service.getSubgraph('application', 'app-1', 2);

      expect(mockRepository.getSubgraph).toHaveBeenCalledWith('application', 'app-1', 2);
      expect(result).toEqual(mockGraphResult);
    });
  });
});
