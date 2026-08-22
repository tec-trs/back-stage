## Task 1 Review Package

### Commit Log
42ce9de test: add unit tests for EcosystemGraphService (5 tests)

### Stat Summary
 .../application/ecosystem-graph.service.test.ts    | 85 ++++++++++++++++++++++
 1 file changed, 85 insertions(+)

### Full Diff
diff --git a/packages/backend/src/modules/ecosystem/application/ecosystem-graph.service.test.ts b/packages/backend/src/modules/ecosystem/application/ecosystem-graph.service.test.ts
new file mode 100644
index 0000000..583e268
--- /dev/null
+++ b/packages/backend/src/modules/ecosystem/application/ecosystem-graph.service.test.ts
@@ -0,0 +1,85 @@
+import { describe, it, expect, beforeEach, vi } from 'vitest';
+import { EcosystemGraphService } from './ecosystem-graph.service.js';
+import type { EcosystemGraph, IEcosystemGraphRepository } from '../infrastructure/ecosystem-graph.repository.js';
+
+describe('EcosystemGraphService', () => {
+  let service: EcosystemGraphService;
+  let mockRepository: any;
+
+  beforeEach(() => {
+    mockRepository = {
+      getGraph: vi.fn(),
+    };
+    service = new EcosystemGraphService(mockRepository);
+  });
+
+  it('should return full EcosystemGraph from repository', async () => {
+    const mockGraph: EcosystemGraph = {
+      nodes: [
+        { id: 'srv-1', kind: 'server', type: 'compute', name: 'prod-01', title: 'Prod', lifecycle: 'active' },
+        { id: 'app-1', kind: 'application', type: 'api', name: 'user-svc', title: 'User Service', lifecycle: 'active' },
+      ],
+      edges: [
+        { id: 'edge-1', source: 'srv-1', target: 'app-1', relationType: 'hosts' },
+      ],
+    };
+
+    mockRepository.getGraph.mockResolvedValue(mockGraph);
+
+    const result = await service.getGraph();
+
+    expect(result).toEqual(mockGraph);
+    expect(mockRepository.getGraph).toHaveBeenCalledOnce();
+  });
+
+  it('should return empty graph when no resources exist', async () => {
+    const emptyGraph: EcosystemGraph = { nodes: [], edges: [] };
+    mockRepository.getGraph.mockResolvedValue(emptyGraph);
+
+    const result = await service.getGraph();
+
+    expect(result.nodes).toEqual([]);
+    expect(result.edges).toEqual([]);
+  });
+
+  it('should propagate repository errors', async () => {
+    mockRepository.getGraph.mockRejectedValue(new Error('DB connection failed'));
+
+    await expect(service.getGraph()).rejects.toThrow('DB connection failed');
+  });
+
+  it('should have nodes with required fields', async () => {
+    const mockGraph: EcosystemGraph = {
+      nodes: [
+        { id: 'srv-1', kind: 'server', type: 'compute', name: 'prod-01', title: null, lifecycle: 'active' },
+      ],
+      edges: [],
+    };
+    mockRepository.getGraph.mockResolvedValue(mockGraph);
+
+    const result = await service.getGraph();
+
+    expect(result.nodes[0]).toHaveProperty('id');
+    expect(result.nodes[0]).toHaveProperty('kind');
+    expect(result.nodes[0]).toHaveProperty('type');
+    expect(result.nodes[0]).toHaveProperty('name');
+    expect(result.nodes[0]).toHaveProperty('lifecycle');
+  });
+
+  it('should have edges with required fields', async () => {
+    const mockGraph: EcosystemGraph = {
+      nodes: [],
+      edges: [
+        { id: 'edge-1', source: 'srv-1', target: 'app-1', relationType: 'hosts' },
+      ],
+    };
+    mockRepository.getGraph.mockResolvedValue(mockGraph);
+
+    const result = await service.getGraph();
+
+    expect(result.edges[0]).toHaveProperty('id');
+    expect(result.edges[0]).toHaveProperty('source');
+    expect(result.edges[0]).toHaveProperty('target');
+    expect(result.edges[0]).toHaveProperty('relationType');
+  });
+});
