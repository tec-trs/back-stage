import { z } from 'zod';

const slugSchema = z
  .string()
  .min(2)
  .max(255)
  .regex(/^[a-z0-9_-]+$/, 'slug deve conter apenas letras minusculas, numeros, hifen e underscore');

const roleEnum = z.enum(['owner', 'member']);

export const createTeamBodySchema = z.object({
  name: z.string().min(1).max(255),
  slug: slugSchema,
  description: z.string().nullable().optional(),
});

export const updateTeamBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
});

export const addMemberBodySchema = z.object({
  userId: z.string().uuid(),
  role: roleEnum.default('member'),
});

export const updateMemberRoleBodySchema = z.object({
  role: roleEnum,
});

export const teamIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const memberParamsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});
