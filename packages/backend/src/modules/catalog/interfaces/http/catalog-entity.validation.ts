import { z } from 'zod';

export const listCatalogEntitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  kind: z.enum(['component', 'api', 'resource', 'system', 'domain']).optional(),
  lifecycle: z.enum(['experimental', 'production', 'deprecated']).optional(),
  namespace: z.string().optional(),
});

export const catalogEntityIdParamsSchema = z.object({ id: z.string().uuid() });
