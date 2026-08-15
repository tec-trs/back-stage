import { z } from 'zod';

const roleEnum = z.enum(['admin', 'maintainer', 'viewer']);
const codeSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9._-]+$/, 'codigo deve conter apenas letras minusculas, numeros, ponto, hifen e underscore');

export const createUserBodySchema = z.object({
  code: codeSchema,
  email: z.string().email().max(255),
  fullName: z.string().min(1).max(255),
  password: z.string().min(8).max(255),
  roles: z.array(roleEnum).min(1),
});

export const updateUserBodySchema = z.object({
  code: codeSchema.optional(),
  email: z.string().email().max(255).optional(),
  fullName: z.string().min(1).max(255).optional(),
  roles: z.array(roleEnum).min(1).optional(),
  password: z.string().min(8).max(255).optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
