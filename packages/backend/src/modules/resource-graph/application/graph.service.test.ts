import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GraphService } from './graph.service';
import { createMockEdge, createMockServer, createMockApplication, createMockDatabase } from '../../../test-fixtures/mock-factories';

describe('GraphService.simulateImpact', () => {
  let service: GraphService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      getFullGraph: vi.fn().mockResolvedValue([]),
      getSubgraph: vi.fn().mockResolvedValue([]),
      listRelationships: vi.fn().mockResolvedValue([]),
      getTransitiveImpact: vi.fn().mockResolvedValue({}),
      createRelationship: vi.fn().mockResolvedValue({}),
      deleteRelationship: vi.fn().mockResolvedValue(undefined),
      getCriticalResources: vi.fn().mockResolvedValue([]),
    };
    service = new GraphService(mockRepository);
  });

  it('should identify direct dependents when a resource is deleted', async () => {
    // Arrange
    const app1 = createMockApplication({ id: 'app1', name: 'App 1' });
    const app2 = createMockApplication({ id: 'app2', name: 'App 2' });
    const db1 = createMockDatabase({ id: 'db1', name: 'Database 1' });

    const impactResult = {
      directlyImpacted: [app1, app2],
      transitivelyImpacted: [],
      byType: { application: 2 },
      byDepth: { 1: 2 },
      totalImpacted: 2,
      hasCycle: false,
    };

    mockRepository.getTransitiveImpact.mockResolvedValue(impactResult);

    // Act
    const impact = await service.simulateImpact('database', 'db1');

    // Assert
    expect(impact.directlyImpacted).toHaveLength(2);
    expect(impact.directlyImpacted).toContainEqual(
      expect.objectContaining({ id: 'app1' })
    );
    expect(impact.directlyImpacted).toContainEqual(
      expect.objectContaining({ id: 'app2' })
    );
  });

  it('should calculate transitive impact (cascade effect)', async () => {
    // Arrange
    const server1 = createMockServer({ id: 'server1', name: 'Server 1' });
    const app1 = createMockApplication({ id: 'app1', name: 'App 1' });
    const db1 = createMockDatabase({ id: 'db1', name: 'Database 1' });

    const impactResult = {
      directlyImpacted: [app1],
      transitivelyImpacted: [server1],
      byType: { application: 1, server: 1 },
      byDepth: { 1: 1, 2: 1 },
      totalImpacted: 2,
      hasCycle: false,
    };

    mockRepository.getTransitiveImpact.mockResolvedValue(impactResult);

    // Act
    const impact = await service.simulateImpact('database', 'db1');

    // Assert
    expect(impact.transitivelyImpacted).toBeDefined();
    expect(impact.transitivelyImpacted).toContainEqual(
      expect.objectContaining({ id: 'server1' })
    );
  });

  it('should handle cycles without infinite loops', async () => {
    // Arrange
    const app1 = createMockApplication({ id: 'app1', name: 'App 1' });
    const app2 = createMockApplication({ id: 'app2', name: 'App 2' });

    const impactResult = {
      directlyImpacted: [app2],
      transitivelyImpacted: [app1],
      byType: { application: 2 },
      byDepth: { 1: 1, 2: 1 },
      totalImpacted: 2,
      hasCycle: true,
    };

    mockRepository.getTransitiveImpact.mockResolvedValue(impactResult);

    // Act
    const impact = await service.simulateImpact('application', 'app1');

    // Assert
    expect(impact).toBeDefined();
    expect(impact.hasCycle).toBe(true);
  });
});
