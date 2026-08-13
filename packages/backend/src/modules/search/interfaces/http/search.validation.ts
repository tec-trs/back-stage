import { z } from 'zod';

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  kind: z.enum(['component', 'api', 'resource', 'system', 'domain']).optional(),
  lifecycle: z.enum(['experimental', 'production', 'deprecated']).optional(),
  namespace: z.string().optional(),
  type: z.string().optional(),
});

export const suggestQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
