import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response } from 'express';
import { EcosystemGraphController } from './ecosystem-graph.controller.js';
import type { EcosystemGraph } from '../../infrastructure/ecosystem-graph.repository.js';

describe('EcosystemGraphController', () => {
  let controller: EcosystemGraphController;
  let mockService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getGraph: vi.fn(),
    };
    controller = new EcosystemGraphController(mockService);

    mockRequest = {};
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it('should return 200 with EcosystemGraph', async () => {
    const mockGraph: EcosystemGraph = {
      nodes: [{ id: 'srv-1', kind: 'server', type: 'compute', name: 'prod-01', title: null, lifecycle: 'active' }],
      edges: [],
    };

    mockService.getGraph.mockResolvedValue(mockGraph);

    await controller.getGraph(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(mockGraph);
  });

  it('should call service.getGraph() exactly once', async () => {
    mockService.getGraph.mockResolvedValue({ nodes: [], edges: [] });

    await controller.getGraph(mockRequest as Request, mockResponse as Response);

    expect(mockService.getGraph).toHaveBeenCalledOnce();
    expect(mockService.getGraph).toHaveBeenCalledWith();
  });

  it('should return valid JSON with nodes and edges', async () => {
    const mockGraph: EcosystemGraph = {
      nodes: [],
      edges: [],
    };
    mockService.getGraph.mockResolvedValue(mockGraph);

    await controller.getGraph(mockRequest as Request, mockResponse as Response);

    const response = (mockResponse.json as any).mock.calls[0][0];
    expect(response).toHaveProperty('nodes');
    expect(response).toHaveProperty('edges');
  });

  it('should handle service errors (relies on Express error middleware)', async () => {
    mockService.getGraph.mockRejectedValue(new Error('DB unavailable'));

    // In real code, Express error middleware catches this
    // Test verifies the error is thrown (not caught)
    await expect(controller.getGraph(mockRequest as Request, mockResponse as Response)).rejects.toThrow('DB unavailable');
  });
});
