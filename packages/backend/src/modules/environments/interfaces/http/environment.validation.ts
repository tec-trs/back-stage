import { z } from 'zod';

const slugSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(
    /^[a-z0-9_-]+$/,
    'slug deve conter apenas letras minusculas, numeros, hifen ou underscore',
  );

const colorEnum = z.enum(['success', 'warning', 'danger', 'default']);

export const createEnvironmentBodySchema = z.object({
  slug: slugSchema,
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().optional(),
  color: colorEnum.optional().default('default'),
  isActive: z.boolean().optional().default(true),
});

export const updateEnvironmentBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    color: colorEnum.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => (Object.values(d) as unknown[]).some((v) => v !== undefined), {
    message: 'Ao menos um campo deve ser informado',
  });

export const environmentIdParamsSchema = z.object({
  id: z.string().uuid('ID invalido'),
});
