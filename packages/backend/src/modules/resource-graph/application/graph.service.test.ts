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
    const app1 = { resourceType: 'application' as const, resourceId: 'app1', label: 'App 1', depth: 1 };
    const app2 = { resourceType: 'application' as const, resourceId: 'app2', label: 'App 2', depth: 1 };

    const impactResult = {
      impactedResources: [app1, app2],
      byType: { application: 2, server: 0, database: 0, url: 0, vip: 0, group: 0 },
      byDepth: { 1: [app1, app2] },
      totalImpacted: 2,
      hasCycle: false,
    };

    mockRepository.getTransitiveImpact.mockResolvedValue(impactResult);

    // Act
    const impact = await service.simulateImpact('database', 'db1');

    // Assert
    expect(impact.impactedResources).toHaveLength(2);
    expect(impact.impactedResources).toContainEqual(
      expect.objectContaining({ resourceId: 'app1' })
    );
    expect(impact.impactedResources).toContainEqual(
      expect.objectContaining({ resourceId: 'app2' })
    );
  });

  it('should calculate transitive impact (cascade effect)', async () => {
    // Arrange
    const app1 = { resourceType: 'application' as const, resourceId: 'app1', label: 'App 1', depth: 1 };
    const server1 = { resourceType: 'server' as const, resourceId: 'server1', label: 'Server 1', depth: 2 };

    const impactResult = {
      impactedResources: [app1, server1],
      byType: { application: 1, server: 1, database: 0, url: 0, vip: 0, group: 0 },
      byDepth: { 1: [app1], 2: [server1] },
      totalImpacted: 2,
      hasCycle: false,
    };

    mockRepository.getTransitiveImpact.mockResolvedValue(impactResult);

    // Act
    const impact = await service.simulateImpact('database', 'db1');

    // Assert
    expect(impact.impactedResources).toBeDefined();
    expect(impact.impactedResources).toContainEqual(
      expect.objectContaining({ resourceId: 'server1', depth: 2 })
    );
  });

  it('should handle cycles without infinite loops', async () => {
    // Arrange
    const app2 = { resourceType: 'application' as const, resourceId: 'app2', label: 'App 2', depth: 1 };
    const app1 = { resourceType: 'application' as const, resourceId: 'app1', label: 'App 1', depth: 2 };

    const impactResult = {
      impactedResources: [app2, app1],
      byType: { application: 2, server: 0, database: 0, url: 0, vip: 0, group: 0 },
      byDepth: { 1: [app2], 2: [app1] },
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
