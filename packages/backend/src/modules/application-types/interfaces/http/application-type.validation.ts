import { z } from 'zod';

const slugSchema = z
  .string()
  .min(2)
  .max(50)
  .regex(/^[a-z0-9_-]+$/, 'slug deve conter apenas letras minusculas, numeros, hifen e underscore');

export const createApplicationTypeBodySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateApplicationTypeBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => (Object.values(d) as unknown[]).some((v) => v !== undefined), {
    message: 'Ao menos um campo deve ser informado',
  });

export const applicationTypeIdParamsSchema = z.object({
  id: z.string().uuid(),
});
