import { z } from 'zod';

const lifecycleEnum = z.enum(['experimental', 'production', 'deprecated']);

export const createServiceBodySchema = z.object({
  type: z.string().min(1).max(100),
  name: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-]+$/, 'name deve conter apenas letras minusculas, numeros e hifen'),
  namespace: z.string().min(1).max(255).default('default'),
  title: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  lifecycle: lifecycleEnum.default('experimental'),
  ownerTeamId: z.string().uuid().nullable().optional(),
  systemId: z.string().uuid().nullable().optional(),
  repositoryUrl: z.string().url().max(2048).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateServiceBodySchema = createServiceBodySchema.partial();

export const serviceIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listServicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  lifecycle: lifecycleEnum.optional(),
  ownerTeamId: z.string().uuid().optional(),
  systemId: z.string().uuid().optional(),
  namespace: z.string().optional(),
  type: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'lifecycle']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const searchServicesQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
