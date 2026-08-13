import { z } from 'zod';

export const createDeploymentBodySchema = z.object({
  entityId: z.string().uuid(),
  environment: z.enum(['development', 'staging', 'production']),
  version: z.string().min(1).max(100),
  status: z.enum(['pending', 'running', 'succeeded', 'failed', 'rolled_back']).default('pending'),
  metadata: z.record(z.unknown()).optional(),
});

export const deploymentIdParamsSchema = z.object({ id: z.string().uuid() });

export const listDeploymentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  entityId: z.string().uuid().optional(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
  status: z.enum(['pending', 'running', 'succeeded', 'failed', 'rolled_back']).optional(),
});
