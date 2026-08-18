import { z } from 'zod';

export const orgIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createOrgBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens'),
  name: z.string().min(2).max(255),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateOrgBodySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
  metadata: z.record(z.unknown()).optional(),
});
