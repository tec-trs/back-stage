import { z } from 'zod';

export const createDatabaseEngineBodySchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/i, 'slug deve conter apenas letras, numeros, hifen e underscore'),
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  defaultPort: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateDatabaseEngineBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  defaultPort: z.coerce.number().int().positive().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const databaseEngineIdParamsSchema = z.object({
  id: z.string().uuid(),
});
